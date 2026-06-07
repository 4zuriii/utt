import type { TestResult } from "$public/core.ts"

// export function line(str: string) {
//     console.log(this)
//     return str
// }

export function assertExactOutput(output: TestResult, expected: TestResult) {
    if (output.stdout !== expected.stdout) throw new Error("Incorrect output")
    if (output.meta.code !== expected.meta.code) throw new Error(`Program exited with ${output.meta.code}, when ${expected.meta.code} was expected`)
}