// This module is responsible for traversing the .utt/src directory and compiling source .js test classes into actual tests

import type { Test } from "utt"
import { executeTest } from "$src/tester/executor.ts"
import { loadTest } from "$src/tester/loader.ts"
import { ensureDir, exists } from "@std/fs"
import { join } from "@std/path"
import { assertDir, getSrcDir, getTestsDir } from "$src/utils/dirs.ts"
import cfg from "$src/utils/state.ts"
import { ZipFile } from "$src/utils/zip.ts"

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
		if (!test.isFile || !test.name.endsWith('.js')) continue

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
    const archivePath = join(dest, testName.replace(".js", ".zip"))
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
    await zip.addFile("test.js", testFile.readable)
    await zip.addFile("model.out", result.out)
    await zip.addFile("status.json", ReadableStream.from([JSON.stringify(await result.status)]).pipeThrough(new TextEncoderStream()))
    
    // assert the test returns with the declared exit code
    test.__assertCode?.((await result.status).code)
    
    for (const [ path, file ] of await test.__files()) {
        await zip.addFile("env/" + path, file)
    }
}
