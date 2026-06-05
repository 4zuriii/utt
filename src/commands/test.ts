import { prepareTasks } from "$src/runner/loader.ts"
import { readWorkspace, readPackage } from "$src/runner/finder.ts"
import { runTests } from "$src/runner/runner.ts"
import type { TestDescriptor } from "$types/tests.ts";
import cfg from "$config/cfg.ts";

export async function testCommand(pkg: string, options: any) {
    let program = getDefaultProgram()
    if (cfg.has("program")) {
        program = cfg.get("program")
    }
    if (options.program) {
        program = options.program
    }
    console.log(program)

    let descriptors: TestDescriptor[];

    if (pkg) {
        descriptors = await readPackage(pkg)
    } else {
        descriptors = await readWorkspace()
    }

    const tasks = await prepareTasks(descriptors)

    runTests(tasks)
}

function getDefaultProgram(): string {
    return "./program"
}
