// This module is responsible for loading tests, in particular this is where Test classe sget instantiated

import type { Test, TestOutput } from "utt"
import { ZipReaderStream } from "@zip-js/zip-js"
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