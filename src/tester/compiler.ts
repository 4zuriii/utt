// This module is responsible for traversing the .utt/src directory and compiling source .js test classes into actual tests

import type { Test } from "utt"
import { executeTest } from "$src/tester/executor.ts"
import { TarStream } from '@std/tar'
import { loadTest } from "$src/tester/loader.ts"
import { ensureDir } from "@std/fs"
import { join } from "@std/path"
import { assertDir, getSrcDir, getTestsDir } from "$src/utils/dirs.ts"
import cfg from "$src/utils/state.ts"

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
    compileGroup(
        src, 
        dest,
        program
    )

	const groups = Deno.readDir(src)
	
	for await (const dir of groups) {
		if (!dir.isDirectory) continue

		compileGroup(
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

        compileTest(
            src,
            dest,
            test.name,
            program
        )
	}
}

async function compileTest(src: string, dest: string, test: string, program: string) {
    // path to test
    const path = join(src, test)

    const testInstance: Test = await loadTest(path)
    
    const testFile = await Deno.open(path)
    
    // prepare the test package for writing
    await ensureDir(dest)
    const archive = await Deno.open(join(
        dest,
        test.replace(".js", ".utest")
    ), {
        create: true,
        write: true,
    })
    
    // generate the expected answer
    const result = await executeTest(testInstance, program)
    testInstance.assertCode?.(result.meta.code)
    
    const stream = new ReadableStream({
        async start(controller) {
            // copy test.ts class into the archive
            controller.enqueue({
                type: "file",
                path: "test.js",
                size: (await testFile.stat()).size,
                readable: testFile.readable,
            });

            // save the output of the test into the archive
            const out = new TextEncoder().encode(result.stdout)

            controller.enqueue({
                type: "file",
                path: "model.out",
                size: out.byteLength,
                readable: ReadableStream.from([out])
            })
            
            // save the metadata
            const meta = JSON.stringify(result.meta)
            const metaBytes = new TextEncoder().encode(meta)
            
            controller.enqueue({
                type: "file",
                path: "meta.json",
                size: metaBytes.byteLength,
                readable: ReadableStream.from([metaBytes])
            })

            // save all the files created by the execution of the test
            for (const [ file, content ] of result.files) {
                const bytes = new TextEncoder().encode(content)

                controller.enqueue({
                    type: "file",
                    path: file,
                    size: bytes.byteLength,
                    readable: ReadableStream.from([bytes])
                })
            }
        
            controller.close();
        }
    })

    await stream.pipeThrough(new TarStream()).pipeTo(archive.writable)
}
