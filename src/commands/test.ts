import { readPackage, readAll } from "$src/tester/finder.ts"
import type { TestDescriptor } from "$types/tests.ts"
import { runTests } from "$src/tester/runner.ts"

type OptionsObject = {
	program: string
	preserveOutput: string
}

async function assertExists(program: string) {
	let file: Deno.FileInfo

	try {
		file = await Deno.lstat(program)
	} catch (_err) {
		throw new Error("Program not found")
	}

	if (!file.isFile) throw new Error("Not a file")

	return program
}

export async function testCommand(pkg: string, options: OptionsObject) {
	const program = await assertExists(options.program)

	let descriptors: TestDescriptor[]

	if (pkg) {
		descriptors = await readPackage(pkg)
	} else {
		descriptors = await readAll()
	}

	runTests(descriptors, program)
}
