// This module is responsible for traversing the .utt/src directory and compiling source .js test classes into actual tests

import type { Test } from "utt"
import { executeTest } from "$src/tester/executor.ts"
import { loadTest } from "$src/tester/loader.ts"
import { ensureDir, exists, walk } from "@std/fs"
import { join } from "@std/path"
import { assertDir, getSrcDir, getTestsDir } from "$src/utils/dirs.ts"
import cfg from "$utils/state.ts"
import { ZipFile } from "$utils/zip.ts"
import { UTEST_EXT, UTEST_MODEL_OUT_FNAME, UTEST_STATUS_FNAME, UTEST_TEST_EXT, UTEST_TEST_FNAME } from "$utils/constants.ts"
import { makeEnv, discardFiles, deleteEnv } from "$utils/env.ts"
import { TestExecutionSymbols } from "$utils/types.ts"

export async function compilePackage(pkg: string, program?: string) {
    program = program ?? cfg.get("cfg.program")

	const src = join(
		await getSrcDir(),
		pkg
	)

    const dest = join(
        await getTestsDir(),
        pkg
    )

	await assertDir(src)

	// treat tests outside of any group as it's own group
    await compileGroup(
        src, 
        dest,
        program
    )

	const groups = Deno.readDir(src)
	
	for await (const dir of groups) {
		if (!dir.isDirectory) continue

		await compileGroup(
            join(src, dir.name), 
            join(dest, dir.name),
            program
        )
	}
}

async function compileGroup(src: string, dest: string, program: string) {
	const tests = Deno.readDir(src)

	for await (const test of tests) {
		if (!test.isFile || !test.name.endsWith(UTEST_TEST_EXT)) continue

        await compileTest(
            src,
            dest,
            test.name,
            program
        )
	}
}

async function compileTest(src: string, dest: string, testName: string, program: string) {
    // path to test
    const path = join(src, testName)

    const test: Test = await loadTest(path)
    
    using testFile = await Deno.open(path)
    
    // prepare the test package for writing
    const archivePath = join(dest, testName.replace(UTEST_TEST_EXT, UTEST_EXT))
    await ensureDir(dest)
    if (await exists(archivePath)) {
        await Deno.remove(archivePath)
    }
    using archive = await Deno.open(archivePath, {
        create: true,
        write: true,
    })
    await using zip = new ZipFile(archive.writable)

    const env = await prepareTest(test, zip)
    
    // generate the expected answer
    const result = await executeTest(test, program, env)

    // remove files marked for discarding (they were only neccesary at input)
    await discardFiles(test, env)
    
    // populate the archive
    await zip.addFile(UTEST_TEST_FNAME, testFile.readable)
    await zip.addFile(UTEST_MODEL_OUT_FNAME, result.out)
    await zip.addFile(UTEST_STATUS_FNAME, ReadableStream.from([JSON.stringify(await result.status)]).pipeThrough(new TextEncoderStream()))
    for await (const entry of walk(env, { includeDirs: false, includeSymlinks: false })) {
        const file = await Deno.open(entry.path) // the file should not be closed, reading the stream will do it
        await zip.addFile(entry.name, file.readable, "out")
    }

    await deleteEnv(env)

    // await Deno.remove(env, { recursive: true })

    // assert the test returns with the declared exit code
    /*try {
        test.__assertCode?.((await result.status).code)
    } catch (e) {
        console.log(brightYellow(e as string))
        await Deno.remove(archivePath)
    }*/
}

// creates a temporary directory as the test environment, 
// saves and prepares input files
async function prepareTest(test: Test, zip: ZipFile): Promise<string> {
	const env = await makeEnv() 

    const files = test[TestExecutionSymbols.collectFiles]()

    for (const file of files.dynamicFiles) {
        await Deno.writeFile(join(env, file.testPath), file.readable)
    }

    for (const file of files.importedFiles) {
        const readable = (await Deno.open(file.realPath)).readable

        const [stream1, stream2] = readable.tee(); // copy the stream
        await Deno.writeFile(join(env, file.testPath), stream1)
        await zip.addFile(file.testPath, stream2, "in")
    }

    return env
}


