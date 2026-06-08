// This module is responsible for the actual running of the tested program

import type { Test, TestOutput } from "utt"
import { makeTemp } from "$src/utils/temp.ts"

// runs a test and returns data regarding its execution
export async function executeTest(test: Test, program: string): Promise<TestOutput> {
	// prepare the task
	const temp = await makeTemp()

	const command = new Deno.Command(program, {
		stdin: "piped",
		stdout: "piped",
		args: test.args(),
		cwd: temp
	})

	const instance = command.spawn()

	// give the program input
	await test.__input().pipeTo(instance.stdin)

	// apply transforms defined in the test to the output
	let output: ReadableStream<Uint8Array> = instance.stdout
	for (const transform of  test.transform?.() ?? []) {
		output = output.pipeThrough(transform)
	}

	return {
		out: output,
		status: instance.status,
		stats: {},
		files: new Map<string, ReadableStream<Uint8Array>>()
	}  
}