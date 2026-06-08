import { resolve } from "@std/path/resolve"
import { hash } from "node:crypto"

export type Metadata = {
	code: number
}

export type TestOutput = {
		out: ReadableStream<Uint8Array>,
		status: Deno.ChildProcess["status"],
		stats: {},
		files: Map<string, ReadableStream<Uint8Array>>
}

class stdinStream {
	#controller!: ReadableStreamDefaultController
	#stream: ReadableStream

	constructor() {
		this.#stream = new ReadableStream({
			start: controller => {
				this.#controller = controller
			}
		})
	}

	push(text: string) {
		this.#controller.enqueue(Buffer.from(text))
	}

	finish(): ReadableStream {
		this.#controller.close()

		return this.#stream
	}
}

/**
 * @abstract
 * @class Test
 * @description A baseline class for defining tests
 */
export abstract class Test {
	#stdin = new stdinStream()
	#files = new Map<string, Promise<Uint8Array>>()

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
	transform?(): TransformStream[]
	
	// HELPER UTILITIES

	// INPUT HELPERS

	/**
     * Add a line to the standard input
     * @param {string} text the line to push
     * @returns {void}
     */
	line(text: string): void {
		this.#stdin.push(text)
		this.#stdin.push("\n")
	}
	
	/**
     * Concatenate the standard input with the given string
     * @param {string} text - text to append
     * @returns {void}
     */
	append(text: string): void {
		this.#stdin.push(text)
	}

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
     * @param {string} input the data to hash
     * @returns {string} A sha256 hash of the output
     */
	hash(input: string): string {
		return hash("sha512", input)
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

	// DEV FUNCTIONS
	/**
	 * DO NOT USE IN YOUR TEST
	 */
	__input(): ReadableStream {
		this.input()

		return this.#stdin.finish()
	}

	/**
	 * DO NOT USE IN YOUR TEST
	 */
	async __files(): Promise<Map<string, ReadableStream<any>>> {
		this.files?.()

		await Promise.all(this.#files.values())

		const res = new Map<string, ReadableStream<Uint8Array>>()

		this.#files.entries().forEach(async ([k, v]) => {
			res.set(k, ReadableStream.from([await v]))
		})

		console.log(res, 1)

		return res
	}
	
	/**
	 * DO NOT USE IN YOUR TEST
	 * @param code 
	 */
	__assertCode?(code: number): void 
}

// Test class decorators
// These are useful for asserting that the generated tests make sense, therefore if compiling a test 
// marked by @ShouldPass generates an expected exit code other than 0, the compilation will stop

// maybe? turns out decorators are ts only, so for now ununsed

// deno-lint-ignore no-explicit-any
export function ShouldPass<T extends { new (...args: any[]): any }>(target: T) {
	return class extends target {
		assertCode(code: number) {
			if (code !== 0) throw new Error("Class with @ShouldPass failed")
		}
	}
}

// deno-lint-ignore no-explicit-any
export function ShouldFail<T extends { new (...args: any[]): any }>(target: T) {
	return class extends target {
		assertCode(code: number) {
			if (code === 0) throw new Error("Class with @ShouldFail passed")
		}
	}
}

export function ShouldExitWith(expected: number) {
	// deno-lint-ignore no-explicit-any
	return function<T extends { new (...args: any[]): any }>(target: T) {
		return class extends target {
			assertCode(code: number) {
				if (code !== expected) throw new Error(`Class with @ShouldExitWith(${expected}) exited with code ${code}`)
			}
		}
}
}