import type { FullTestInterface, TestResult } from "utt"
import { makeTemp } from "$src/utils/temp.ts"
import { relative } from "@std/path"
import { walk } from "@std/fs"
import { toText } from "@std/streams/to-text"

// runs a test and returns its output
export async function executeTest(test: FullTestInterface, program: string) {
	// prepare the task
	const temp = await makeTemp()

	const command = new Deno.Command(program, {
		stdin: "piped",
		stdout: "piped",
		args: test.args(),
		cwd: temp
	})

	const instance = command.spawn()
	
	const writer = instance.stdin.getWriter()
	writer.write(new TextEncoder().encode(test.stdin()))
	writer.close()

	const { code, stdout } = await instance.output()

	let output = new TextDecoder().decode(stdout)
	if (test.parse) output = test.parse(output)

	// TODO: Rework logic to handle files as ReadableStream throughout the program
	const files = new Map<string, string>()
	for await (const entry of walk(temp, { includeDirs: false, includeSymlinks: false })) {
		const path = relative(temp, entry.path)
		
		const file = await Deno.open(entry.path, { read: true })
		
		files.set(path, await toText(file.readable))

		file.close()
	}

	return {
		stdout: output,
		meta: {
			code
		},
		files: new Map<string, string>()
	}  as TestResult
}