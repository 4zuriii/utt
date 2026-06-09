// This module is responsible for traversing the .utt/src directory and compiling source .js test classes into actual tests

import type { Test } from "utt"
import { executeTest } from "$src/tester/executor.ts"
import { loadTest } from "$src/tester/loader.ts"
import { ensureDir, exists } from "@std/fs"
import { join } from "@std/path"
import { assertDir, getSrcDir, getTestsDir } from "$src/utils/dirs.ts"
import cfg from "$src/utils/state.ts"
import { ZipFile } from "$src/utils/zip.ts"
import { brightYellow } from "@std/fmt/colors"
import { UTEST_EXT, UTEST_MODEL_OUT_FNAME, UTEST_STATUS_FNAME, UTEST_TEST_EXT, UTEST_TEST_FNAME } from "$utils/constants.ts"

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
    
    // generate the expected answer
    const result = await executeTest(test, program)
    
    // populate the archive
    await zip.addFile(UTEST_TEST_FNAME, testFile.readable, "meta")
    await zip.addFile(UTEST_MODEL_OUT_FNAME, result.out, "meta")
    await zip.addFile(UTEST_STATUS_FNAME, ReadableStream.from([JSON.stringify(await result.status)]).pipeThrough(new TextEncoderStream()), "meta")
    for (const [ path, file ] of result.files) {
        await zip.addFile(path, file)
    }

    // assert the test returns with the declared exit code
    try {
        test.__assertCode?.((await result.status).code)
    } catch (e) {
        console.log(brightYellow(e as string))
        await Deno.remove(archivePath)
    }
}
