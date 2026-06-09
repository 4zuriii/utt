// This module is responsible for loading tests, in particular this is where Test classe sget instantiated

import type { Test, TestOutput } from "utt"
import { UntarStream } from "@std/tar/untar-stream"
import { toJson, toText } from '@std/streams'
import { encodeBase64Url } from '@std/encoding'
import { UTEST_TEST_FNAME, UTEST_MODEL_OUT_FNAME, UTEST_STATUS_FNAME } from "$utils/constants.ts"

/**
 * Create an object of a class specified by `path`
 *
 * @param path path to the class, relative to `.utt/tests/` directory
 */
export async function loadTest(path: string): Promise<Test> {
	const Test = (await import(path)).default

	return new Test()
}

export async function parseUtest(path: string): Promise<{ test: Test; expected: TestOutput }> {
	using file = await Deno.open(path)

	const stream = file.readable.pipeThrough(new UntarStream())

	const result: {
		test: Partial<Test>,
		expected: Partial<TestOutput>
	} = { 
		test: {},
		expected: {
			files: new Map<string, ReadableStream<Uint8Array<ArrayBuffer>>>()
		}
	}

	for await (const file of stream) {
		if (!file.readable) continue

		if (file.path == UTEST_TEST_FNAME) {
			const encoded = encodeBase64Url(await toText(file.readable))

			const test: Test = await loadTest(`data:text/javascript;base64,${encoded}`)

			result.test = test
		} else if (file.path == UTEST_MODEL_OUT_FNAME) {
			result.expected.out = file.readable
		} else if (file.path == UTEST_STATUS_FNAME) {
			result.expected.status = toJson(file.readable) as Promise<Deno.CommandStatus>
		} else {
			// ?. is ugly, but tsc won't stop bitching otherwise even though it's fine
			result.expected.files?.set(file.path, file.readable)
		}
	}

	return result as {
		test: Test,
		expected: TestOutput
	}
}