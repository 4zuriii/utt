import { prepareTasks } from "$src/runner/loader.ts"
import { readWorkspace, readPackage } from "$src/runner/finder.ts"
import { runTests } from "$src/runner/runner.ts"

async function runAllPackages() {
    console.log("Running all...\n\n")


}

async function runPackage(pkg: string) {
    console.log("Running package: " + pkg + "\n\n")

    const descriptors = await readPackage(pkg)

    const tasks = await prepareTasks(descriptors)

    runTests(tasks)

}

export function command(pkg: string) {
    if (pkg) {
        runPackage(pkg)
    } else {
        runAllPackages()
    }
}