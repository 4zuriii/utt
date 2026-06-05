import { prepareTasks } from "$src/runner/loader.ts"
import { readPackage, readWorkspace } from "$src/runner/finder.ts"
import { runTests } from "$src/runner/runner.ts"
import type { TestDescriptor } from "$types/tests.ts"
import cfg from "$src/utlis/cfg.ts"

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

function getProgram(options: OptionsObject) {
	if (options.program) {
		return options.program
	}
	if (cfg.has("program")) {
		return cfg.get("program")
	}

	throw new Error("Program is not specified")
}

export async function testCommand(pkg: string, options: OptionsObject) {
	const program = getProgram(options)
	assertProgramExists(program)

	let descriptors: TestDescriptor[]

	const rootDir = Deno.cwd()

	if (pkg) {
		descriptors = await readPackage(pkg)
	} else {
		descriptors = await readWorkspace()
	}

	const tasks = await prepareTasks(descriptors)

	Deno.chdir(rootDir)

	runTests(tasks, program)
}
