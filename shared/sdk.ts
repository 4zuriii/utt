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

export abstract class Test {
	#stdin = new stdinStream()

	// methods to be implemented by the user
	abstract args(): string[]
	abstract input(): void
	abstract check(output: TestResult, expected: TestResult): void
	abstract parse?(stdout: string): string
	
	// HELPER UTILITIES

	// input helpers
	line(text: string) {
		this.#stdin.push(text)
		this.#stdin.push("\n")
	}
	
	append(text: string) {
		this.#stdin.push(text)
	}

	// parsing utilities
	hash(input: string) {
		return hash('sha256', input)
	}

	// checking utilities
	assertExactOutput(output: TestResult, expected: TestResult) {
		if (output.stdout !== expected.stdout) throw new Error("Incorrect output")
		if (output.meta.code !== expected.meta.code) throw new Error(`Program exited with ${output.meta.code}, when ${expected.meta.code} was expected`)
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