import type { ITest } from "$public/TestInterface.ts"
import { executeTask } from "$src/runner/executor.ts"
import { TarStream } from '@std/tar'
import { loadTest } from "$src/runner/loader.ts"
import { ensureDir, walk } from "@std/fs"
import { relative, join, basename } from "@std/path"
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
		if (!test.isFile || !test.name.endsWith('.ts')) continue

        compileTest(
            src,
            dest,
            test.name,
            program
        )
	}
}

async function compileTest(src: string, dest: string, test: string, program: string) {
    const path = join(src, test)

    const testInstance: ITest = await loadTest(path)
    
    const testFile = await Deno.open(path)
    
    await ensureDir(dest)
    const archive = await Deno.open(join(
        dest,
        test.replace(".ts", ".utest")
    ), {
        create: true,
        write: true,
    })
    
    const temp = await Deno.makeTempDir({ prefix: "utt-" })
    
    const result = await executeTask(program, temp, testInstance)
    
    const stream = new ReadableStream({
        async start(controller) {
            // copy test.ts class into the archive
            controller.enqueue({
                type: "file",
                path: basename(path),
                size: (await testFile.stat()).size,
                readable: testFile.readable,
            });

            // save the output of the test into the archive
            const out = new TextEncoder().encode(result.out)

            controller.enqueue({
                type: "file",
                path: "stdout",
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
            for await (const entry of walk(temp, { includeDirs: false, includeSymlinks: false })) {
                const path = join('files', relative(temp, entry.path))
                
                const file = await Deno.open(entry.path, { read: true })
                const stat = await file.stat()
                
                controller.enqueue({
                    type: "file",
                    path,
                    size: stat.size,
                    readable: file.readable,
                });

                file.close()
            }
        
            controller.close();
        }
    })

    await stream.pipeThrough(new TarStream()).pipeTo(archive.writable)
}
