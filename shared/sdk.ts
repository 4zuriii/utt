import { hash } from "node:crypto"

export type Metadata = {
	code: number
}

export type TestResult = {
	stdout: string,
	meta: Metadata
	files: Map<string, string>
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

	// ABSTRACT METHODS

	/**
     * @abstract
     * @method args
     * @returns {string[]} command-line arguments in an array
     */
	abstract args(): string[]

	/**
     * @abstract
     * @method input
     * @returns {void}
     */
	abstract input(): void

	/**
     * @abstract
     * @method check
     * @description validate the test result
     * @param {TestResult} output the actual output received from running the test
     * @param {TestResult} expected the expected output of the test
     * @returns {void}
	 */
	abstract check(output: TestResult, expected: TestResult): void

	/**
     * @abstract
     * @method parse
     * @description Optionally parse stdout before saving the result 
     * @param {string} stdout raw stdout from the program
     * @returns {string} parsed output
     */
	abstract parse?(stdout: string): string
	
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

	// PARSING UTILITIES

	/**
     * hashes the output
     * @param {string} input the data to hash
     * @returns {string} A sha256 hash of the output
     */
	hash(input: string): string {
		return hash('sha256', input)
	}

	// CHECKING UTILITIES

	/**
     * Checks whether every parameter of the test matches the expected resukt
     * @param {TestResult} output the actual output received from running the test
     * @param {TestResult} expected - the expected output of the test
     * @throws {Error} throws when a difference is found
     * @returns {void}
     */
	assertExactOutput(output: TestResult, expected: TestResult): void {
		if (output.stdout !== expected.stdout) 
			throw new Error("Incorrect output")

		if (output.meta.code !== expected.meta.code) 
			throw new Error(`Program exited with ${output.meta.code}, when ${expected.meta.code} was expected`)

		for (const [ file, expectedValue ] of expected.files) {
			const outputValue = output.files.get(file)

			if (expectedValue !== outputValue)
				throw new Error(`File ${file} is incorrect`)
		}

		if (output.files.size !== expected.files.size)
			throw new Error("Program created too many files")
		
	}

	// DEV FUNCTIONS
	stdin(): ReadableStream {
		this.input()

		return this.#stdin.finish()
	}
	
	abstract assertCode?(code: number): void 
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