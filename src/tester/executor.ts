// This module is responsible for running the program

import type { Test, TestOutput } from "utt"
import { TestExecutionSymbols } from "$utils/types.ts"

// runs a test and returns data regarding its execution
export async function executeTest(test: Test, program: string, cwd: string): Promise<TestOutput> {
	const command = new Deno.Command(program, {
		stdin: "piped",
		stdout: "piped",
		args: test.args?.(),
		cwd
	})

	const instance = command.spawn()

	// give the program input
	await test[TestExecutionSymbols.collectInput]().pipeTo(instance.stdin)

	// apply transforms defined in the test to the output
	let output: ReadableStream<Uint8Array> = instance.stdout
	for (const transform of  test.transform?.() ?? []) {
		output = output.pipeThrough(transform)
	}

	return {
		out: output,
		status: instance.status,
		stats: {}
	}  
}