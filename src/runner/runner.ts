import type { TestDescriptor } from "$types/tests.ts"
import { makeTemp } from "$src/utils/temp.ts"
import { parseUtest } from "$src/runner/loader.ts"
import { executeTest } from "$src/runner/executor.ts"
import type { FullTestInterface, TestResult } from "$public/core.ts"

type TestReport = (
    {
        state: true
    } 
    | {
        state: false,
        error: unknown
    }
)

function validateTest(output: TestResult, expected: TestResult, test: FullTestInterface): TestReport {
    try {
        test.check(output, expected)
        return {state: true}
    } catch (error) {
        if (error instanceof Error) {
            // deno-lint-ignore no-ex-assign
            error = error.message
        } 

        return {
            state: false,
            error
        }
    }
}

export async function runTests(descriptors: TestDescriptor[], program: string) {
    if (descriptors.length == 0) {
        console.log("WARNING: No tests found")
        return
    }

    interface Tasks {
        [pkg: string]: {
            [group: string]: {
                [test: string]: TestReport
            }
        }
    }

    for (const test of descriptors) {
        const temp = await makeTemp()
    
        try {
            const path = await test.resolveClassPath()

            const parsed = await parseUtest(path)

            const output = await executeTest(parsed.test, program)

            const report: TestReport = validateTest(output, parsed.expected, parsed.test)

            console.log(report)
        } finally {
            Deno.remove(temp)
        }
        
    }
}