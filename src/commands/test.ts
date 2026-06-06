import { prepareTasks } from "$src/runner/loader.ts"
import { readPackage, readAll } from "$src/runner/finder.ts"
import { runTests } from "$src/runner/runner.ts"
import type { TestDescriptor } from "$types/tests.ts"
import cfg from "$src/utils/cfg.ts"
import { getRoot } from "$src/utils/paths.ts"
import { join } from "@std/path/join"

type OptionsObject = {
	program: string
	preserveOutput: string
}

async function assertProgramExists(program: string) {
	let file: Deno.FileInfo

	try {
		file = await Deno.lstat(program)
	} catch (err) {
		throw new Error("Program not found")
	}
	if (!file.isFile) throw new Error("Not a file")
}

async function getProgram(options: OptionsObject) {
	if (options.program) {
		return options.program
	}
	if (cfg.has("program")) {
		const root = await getRoot()

		return join(root, cfg.get("program"))
	}

	throw new Error("Program is not specified")
}

export async function testCommand(pkg: string, options: OptionsObject) {
	const program = await getProgram(options)
	assertProgramExists(program)

	let descriptors: TestDescriptor[]

	if (pkg) {
		descriptors = await readPackage(pkg)
	} else {
		descriptors = await readAll()
	}

	const tasks = await prepareTasks(descriptors)

	runTests(tasks, program)
}
