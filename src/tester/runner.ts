// This module is repsonsible for running the tests

import type { TestDescriptor } from "$types/tests.ts"
import { makeTemp } from "$src/utils/temp.ts"
import { parseUtest } from "$src/tester/loader.ts"
import { executeTest } from "$src/tester/executor.ts"
import type { Test, TestOutput } from "utt"
import { bold, brightGreen, brightRed, rgb24 } from "@std/fmt/colors"

const orange = (text: string) => rgb24(text, 0xffa500)

type TestReport = (
    {
        state: true
    } 
    | {
        state: false,
        error: unknown
    }
)

async function validateTest(output: TestOutput, expected: TestOutput, test: Test): Promise<TestReport> {
    try {
        await test.check(output, expected)
        return { state: true }
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

            const fullName = test.group ? test.group + "." + test.name : test.name

            console.log(orange(`Running test: ${bold(fullName)}...`))

            const report: TestReport = await validateTest(output, parsed.expected, parsed.test)

            if (report.state) {
                console.log(brightGreen(`[PASS] Test ${bold(fullName)} passed succesfully`))
            } else {
                console.log(brightRed(`[FAIL] Test ${bold(fullName)} failed`))
                console.log(brightRed(`Fail reason: ${report.error}`))
            }
        } finally {
            Deno.remove(temp)
        }
        
    }
}