// This module is responsible for the actual running of the tested program

import type { Test, TestResult } from "utt"
import { makeTemp } from "$src/utils/temp.ts"
import { relative } from "@std/path"
import { walk } from "@std/fs"
import { toText } from "@std/streams/to-text"

// runs a test and returns data regarding its execution
export async function executeTest(test: Test, program: string): Promise<TestResult> {
	// prepare the task
	const temp = await makeTemp()

	const command = new Deno.Command(program, {
		stdin: "piped",
		stdout: "piped",
		args: test.args(),
		cwd: temp
	})

	const instance = command.spawn()

	test.stdin().pipeTo(instance.stdin)

	const { code, stdout } = await instance.output()

	let output = new TextDecoder().decode(stdout)
	output = test.parse?.(output) ?? output		// parse the output if a parsing function is defined

	// TODO: Rework logic to handle files as ReadableStream throughout the program
	const files = new Map<string, string>()
	for await (const entry of walk(temp, { includeDirs: false, includeSymlinks: false })) {
		const path = relative(temp, entry.path)
		
		using file = await Deno.open(entry.path, { read: true })
		
		files.set(path, await toText(file.readable))
	}

	return {
		stdout: output,
		meta: {
			code
		},
		files: new Map<string, string>()
	}  as TestResult
}