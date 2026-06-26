import { createHashStream } from '$shared/mixins/transform.ts'

export type TestChecks = {
	code?: (result: number, expected: number) => void,
	stdout?: (result: ReadableStream, expected: ReadableStream) => Promise<void>,
	files?: (result: Map<string, ReadableStream>, expected: Map<string, ReadableStream>) => Promise<void>
}

/**
 * @abstract
 * @class Test
 * @description A baseline class for defining tests
 */
export abstract class BaseTest {
	/** 
	 * Specify command-line arguments to be passed to the program,
	 * as an array where each element is one argument
	 * 
     * @optional
     */
	args?(): string[]

	/** 
	 * Specify the standard input for the program
	 * ***
	 * To add a line to the standard input
	 * ```
	 * this.line("A line")
	 * ```
	 * To append text to the standard input, without appending a `\n` character
	 * ```
	 * this.append("A chunk of text")
	 * ```
	 * ***
	 * For big inputs, consider using the JS generator function syntax
	 * ```
	 * *input() {
	 * 	yield "One piece of text"
	 * 	yield "Another piece of text"
	 * 	yield "Finish the line with a \n manually"
	 * }
	 * ```
	 * 
     * @optional
     */
	input?(): void

	/**
	 * Include files into the test
	 * ***
	 * Create a text file
	 * ```
	 * this.textFile("path/the/program/expects", "content")
	 * ```
	 * 
	 * Create any file use the ReadableStream API
	 * ```
	 * this.blobFile("path/the/program/expects", yourReadableStream)
	 * ```
	 * Import a file from your drive
	 * ```
	 * this.importFile("path/the/program/expects", "path/to/file")
	 * ```
	 * 
	 * @optional
	 */
	files?(): void

	/**
	 * Define how the test checks for validity of the test run
	 * ***
	 * The default checks are: 
	 * - return code is the same as the model answer
	 * - stdout is the same as the model answer
	 * - each file written by the program is the same as the model answer
	 * ***
	 * You can customize the behaviour by returning a ```TestChecks``` objects:
	 * ```
	 * type TestChecks = {
	 * 	stdout: (result: ReadableStream, expected: ReadableStream) => void
	 * 	code: (result: number, expected: number) => void
	 * 	files: (result: Map<string, ReadableStream>, expected: Map<string, ReadableStream>) => void
	 * }
	 * ```
	 * Apart from the default functions, there are some other built-in helpers, like:
	 * ```
	 * this.checkErrorCode
	 * ```
	 * you can use to quickly customize the behaviour of the validator.
	 * If you want to write your own function to validate the test, each validator should return nothing
	 * on success, or throw an Error with a message describing the fail reason
	 * 
	 * @return {TestChecks} an object representing the validations to apply
	 */
	abstract check(): TestChecks

	/**
     * Apply transformations to the standard output
	 * ***
	 * This runs as the output is generated, before the result is saved to disk, therefore
	 * you should use:
	 * ```
	 * this.hash()
	 * ```
	 * when generating huge outputs
	 * 
	 * You can also write your own transformations, though I don't recommend it
	 * 
	 * @return an array of transformers
     */
	transform?(): TransformStream<Uint8Array, Uint8Array>[]
	
	/**
     * Hashes the output
     */
	hash(): TransformStream<Uint8Array<ArrayBuffer>> {
		return createHashStream()
	}
}