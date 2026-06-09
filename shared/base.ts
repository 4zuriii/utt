import { resolve } from "@std/path/resolve"
import { createHashStream } from '$shared/mixins/transform.ts'
import type { TestOutput } from "utt"

/**
 * @abstract
 * @class Test
 * @description A baseline class for defining tests
 */
export abstract class BaseTest {
	#files = new Map<string, Promise<Uint8Array<ArrayBufferLike>>>()

	// ABSTRACT METHODS

	/** 
	 * command-line arguments to the testing program
	 * 
     * @abstract
     * @method args
     * @returns {string[]} command-line arguments in an array
     */
	abstract args(): string[]

	/** 
	 * standard input to the testing program
	 * use this.line() to add a line, or this.append() to add the exact string
	 * 
     * @abstract
     * @method input
     * @returns {void}
     */
	abstract input(): void

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

	// FILES UTILITIES

	/**
	 * Copies a file from your drive to the test file
	 * @param testPath the path by which your program will access the file
	 * @param realPath the real path to the file
	 */
	importFile(testPath: string, realPath: string): void {
		const filePromise = Deno.readFile(resolve(realPath))

		this.#files.set(testPath, filePromise)
	}

	/**
	 * Copies a file from your drive to the test file
	 * @param testPath the path by which your program will access the file
	 * @param realPath the real path to the file
	 */
	textFile(testPath: string, content: string): void {
		this.#files.set(testPath, Promise.resolve(Buffer.from(content)))
	}

	// PARSING UTILITIES

	/**
     * Hashes the output
     * @returns {void}
     */
	hash(): TransformStream<Uint8Array<ArrayBuffer>> {
		return createHashStream()
	}

	// CHECKING UTILITIES

	/**
     * Checks whether every parameter of the test matches the expected resukt
     * @param {TestOutput} output the actual output received from running the test
     * @param {TestOutput} expected - the expected output of the test
     * @throws {Error} throws when a difference is found
     * @returns {void}
     */
	async assertExactOutput(output: TestOutput, expected: TestOutput): Promise<void> {
		// if (output.stdout !== expected.stdout) 
		// 	throw new Error("Incorrect output")

		if ((await output.status).code !== (await expected.status).code) 
			throw new Error(`Program exited with ${(await output.status).code}, when ${(await expected.status).code} was expected`)

		for (const [ file, expectedValue ] of expected.files) {
			const outputValue = output.files.get(file)

			if (expectedValue !== outputValue)
				throw new Error(`File ${file} is incorrect`)
		}

		if (output.files.size !== expected.files.size)
			throw new Error("Program created too many files")
		
	}

	/**
	 * DO NOT USE IN YOUR TEST
	 */
	async __files(): Promise<Map<string, ReadableStream<Uint8Array<ArrayBufferLike>>>> {
		this.files?.()

		await Promise.all(this.#files.values())

		const res = new Map<string, ReadableStream<Uint8Array<ArrayBufferLike>>>()

		this.#files.entries().forEach(async ([k, v]) => {
			res.set(k, ReadableStream.from([await v]))
		})

		return res
	}
	
	/**
	 * DO NOT USE IN YOUR TEST
	 * @param code 
	 */
	__assertCode?(code: number): void 
}