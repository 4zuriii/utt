// This module is responsible for running the program

import type { Test, TestOutput } from "utt"
import { makeTemp } from "$utils/temp.ts"
import { join } from "@std/path"
import { walk } from "@std/fs"

// runs a test and returns data regarding its execution
export async function executeTest(test: Test, program: string): Promise<TestOutput> {
	// prepare the task
	const workingDir = await makeTemp()

	// has to be outside of here, as compiling and running need to source files differently
	// add files declared by the user
	for (const [ file, content ] of await test.__collect_files()) {
		await Deno.writeFile(
			join(workingDir, file),
			content
		)
	}

	const command = new Deno.Command(program, {
		stdin: "piped",
		stdout: "piped",
		args: test.args(),
		cwd: workingDir
	})

	const instance = command.spawn()

	// give the program input
	await test.__collect_input().pipeTo(instance.stdin)

	// apply transforms defined in the test to the output
	let output: ReadableStream<Uint8Array> = instance.stdout
	for (const transform of  test.transform?.() ?? []) {
		output = output.pipeThrough(transform)
	}

	// return files after the execution of the program
	const files = new Map<string, ReadableStream<Uint8Array>>()
	for await (const entry of walk(workingDir, { includeDirs: false, includeSymlinks: false })) {
		const file = await Deno.open(entry.path) // the file should not be closed, reading the stream will do it
		files.set(entry.name, file.readable)
	}

	return {
		out: output,
		status: instance.status,
		stats: {},
		files 
	}  
}