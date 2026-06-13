// This module is responsible for loading tests, in particular this is where Test classe sget instantiated

import type { Test } from "utt"

/**
 * Create an object of a class specified by `path`
 *
 * @param path path to the class, relative to `.utt/tests/` directory
 */
export async function loadTest(path: string): Promise<Test> {
	const Test = (await import(path)).default

	return new Test()
}