import { readPackage, readAll, type TestDescriptor } from "$src/tester/finder.ts"
import { runTests } from "$src/tester/runner.ts"
import { terminateWorkers } from "@zip-js/zip-js"
import { app } from "$src/cli.ts"
import { getTestsDir } from "$utils/dirs.ts"

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
		descriptors = await readPackage(await getTestsDir(), pkg)
	} else {
		descriptors = await readAll(await getTestsDir())
	}

	await runTests(descriptors, program).catch((e: Error) => {
		app.error(`An error occured while running tests: ${e.message}`)
	})

	await terminateWorkers()
}
