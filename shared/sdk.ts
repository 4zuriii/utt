import { input } from "@inquirer/prompts"

export type Metadata = {
	code: number
}

export type TestResult = {
	stdout: string,
	meta: Metadata
	files: Map<string, string>
}

export abstract class Test {
	#stdin = ""

	// methods to be implemented by the user
	abstract args(): string[]
	abstract input(): void
	abstract check(output: TestResult, expected: TestResult): void
	abstract parse?(stdout: string): string
	
	// HELPER UTILITIES

	// input helpers
	line(str: string) {
		return this.raw(str.concat("\n"))
	}

	raw(str: string) {
		this.#stdin = this.#stdin.concat(str)
		return this.#stdin
	}

	// checking utilities
	assertExactOutput(output: TestResult, expected: TestResult) {
		if (output.stdout !== expected.stdout) throw new Error("Incorrect output")
		if (output.meta.code !== expected.meta.code) throw new Error(`Program exited with ${output.meta.code}, when ${expected.meta.code} was expected`)
	}

	// DEV FUNCTIONS
	stdin(): string {
		this.#stdin = ""
		this.input()
		return this.#stdin
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