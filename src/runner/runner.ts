import type Test from "$public/TestInterface.ts"
import type { testTask } from "$types/tests.ts"
import type { Option } from "commander"

export async function runTest(testInstance: Test, program: string) {
	const command = new Deno.Command(program, {
		stdin: "piped",
		stdout: "piped",
		args: testInstance.args(),
	})

	const programInstance = command.spawn()

	const writer = programInstance.stdin.getWriter()

	writer.write(new TextEncoder().encode(testInstance.stdin()))
	writer.close()

	const { code, stdout } = await programInstance.output()

	const outText = new TextDecoder().decode(stdout)

	const result = testInstance.check(outText, code)

	return result
}

export async function runTests(tasks: testTask[], program: string) {
	if (tasks.length == 0) {
		console.log(
			"WARNING: No tests found, you might have misspelled an argument",
		)
	}
	for (const task of tasks) {
		console.log(`Running ${task.name}...`)
		const result = await runTest(task.obj, program)
		if (result) {
			console.log(task.name + " passed")
		} else {
			console.log(task.name + " failed")
		}
	}
}
