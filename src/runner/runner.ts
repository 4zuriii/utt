import Test from "$utils/TestInterface.ts";
import { TestDescriptor, testTask } from "$types/tests.ts";

export async function runTest(testInstance: Test) {
    const command = new Deno.Command("../program", {
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

export async function runTests(tasks: testTask[]) {
    if (tasks.length == 0) {
        console.log("WARNING: No tests found, you might have misspelled an argument")
    }
    for (const task of tasks) {
        console.log(`Running ${task.name}...`)
        const result = await runTest(task.obj)
        if (result) {
            console.log(task.name + " passed")
        } else {
            console.log(task.name + " failed")
        }
    }
}
