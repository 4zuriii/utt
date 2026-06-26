// This module is repsonsible for running the tests

import { TestExecutionSymbols } from "$utils/types.ts"
import { executeTest } from "$src/tester/executor.ts"
import type { Test, TestOutput } from "utt"
import { bold, brightGreen, brightRed, rgb24 } from "@std/fmt/colors"
import { deleteEnv, discardFiles, makeEnv } from "$utils/env.ts"
import { ZipReaderStream } from "@zip-js/zip-js"
import { join } from "@std/path/join"
import { UTEST_MODEL_OUT_FNAME, UTEST_STATUS_FNAME, UTEST_TEST_FNAME } from "$utils/constants.ts"
import { loadTest } from "$src/tester/loader.ts"
import { encodeBase64Url } from "@std/encoding"
import { toJson, toText } from "@std/streams"
import { walk } from "@std/fs/walk"
import { relative } from "@std/path/relative"
import type { TestDescriptor } from "$src/tester/finder.ts"

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

type UTest = {
    test: Test,
    expected: TestOutput,
    files: Map<string, ReadableStream<Uint8Array>>
}

async function validateTest(utest: UTest, output: TestOutput, env: string): Promise<TestReport> {
    try {
        const checks = utest.test.check() ?? utest.test.defaultChecks

        // these functions throw when they detect a mismatch
        await checks.stdout?.(output.out, utest.expected.out)
        checks.code?.((await output.status).code, (await utest.expected.status).code)

        if (checks.files) {
            const files = new Map<string, ReadableStream<Uint8Array>>()
            for await (const file of walk(env, { includeDirs: false, includeSymlinks: false })) {
                files.set(
                    relative(env, file.path), 
                    (await Deno.open(file.path)).readable
                )
            }
            await checks.files(files, utest.files)
        }

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
        const env = await makeEnv()
        
        try {
            const path = await test.resolveClassPath()

            const utest = await parseUtest(path, env)

            const output = await executeTest(utest.test, program, env)

            console.log(orange(`Running test: ${bold(test.testName)}...`))
            
            await discardFiles(utest.test, env)

            const report: TestReport = await validateTest(utest, output, env)

            if (report.state) {
                console.log(brightGreen(`[PASS] Test ${bold(test.testName)} passed succesfully`))
            } else {
                console.log(brightRed(`[FAIL] Test ${bold(test.testName)} failed`))
                console.log(brightRed(`Fail reason: ${report.error}`))
            }
        } catch (e) {
            console.log(brightRed(`[FAIL] An error occured while running this test `))
            console.log(brightRed(`Error message: ${e}`))
        } finally {
            await deleteEnv(env)
        }
        
    }
}

async function parseUtest(path: string, env: string): Promise<UTest> {
	using file = await Deno.open(path)

	const stream = file.readable.pipeThrough(new ZipReaderStream())

	const result = {
        files: new Map(),
        expected: {},
    } as Partial<UTest> & {files: UTest["files"], expected: object }

	for await (const file of stream) {
		if (!file.readable) continue
		if (file.directory) continue

		if (file.filename.startsWith("in/")) {
            // input for the test, move it to the environment
            const path = file.filename.slice(3)     // remove the "in/" from the path of the file
            await Deno.writeFile(join(env, path), file.readable)
        } else if (file.filename.startsWith("out/")) {
            const path = file.filename.slice(4)
            result.files.set(path, file.readable)
        } else if (file.filename === UTEST_TEST_FNAME) {
			const encoded = encodeBase64Url(await toText(file.readable))

			const test: Test = await loadTest(`data:text/javascript;base64,${encoded}`)

			result.test = test
		} else if (file.filename === UTEST_MODEL_OUT_FNAME) {
            result.expected.out = file.readable
        } else if (file.filename === UTEST_STATUS_FNAME) {
            result.expected.status = await toJson(file.readable) as Promise<Deno.CommandStatus>
        }
	}

    const files = result.test![TestExecutionSymbols.collectFiles]()

    for (const file of files.dynamicFiles) {
        await Deno.writeFile(join(env, file.testPath), file.readable)
    }

	return result as UTest
}