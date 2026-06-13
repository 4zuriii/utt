import { createHashStream } from '$shared/mixins/transform.ts'
import type { TestOutput } from "utt"

/**
 * @abstract
 * @class Test
 * @description A baseline class for defining tests
 */
export abstract class BaseTest {
	/** 
	 * command-line arguments to the testing program
	 * 
     * @abstract
     * @method args
     * @returns {string[]} command-line arguments in an array
     */
	args?(): string[]

	/** 
	 * standard input to the testing program
	 * use this.line() to add a line, or this.append() to add the exact string
	 * 
     * @abstract
     * @method input
     * @returns {void}
     */
	input?(): void

	/**
	 * Include files into the test
	 * 
	 * use this.importFile() to add a file from your hard drive, or this.textFile() to quickly declare a text file
	 * 
	 * @abstract
	 * @method files
	 * @return {void}
	 */
	files?(): void

	/**
     * @abstract
     * @method check
     * @description validate the test result
     * @param {TestOutput} output the actual output received from running the test
     * @param {TestOutput} expected the expected output of the test
     * @returns {void}
	 */
	abstract check(output: TestOutput, expected: TestOutput): Promise<void>

	/**
     * @method transform
     * @description define transformations to apply to stdout
     * @returns {string} an array of transformers
     */
	transform?(): TransformStream<Uint8Array, Uint8Array>[]
	
	// HELPER UTILITIES
	// PARSING UTILITIES

	/**
     * Hashes the output
     * @returns {void}
     */
	hash(): TransformStream<Uint8Array<ArrayBuffer>> {
		return createHashStream()
	}
}