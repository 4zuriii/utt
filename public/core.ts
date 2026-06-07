export type Metadata = {
	code: number
}

export type TestResult = {
	stdout: string,
	meta: Metadata
	files: Map<string, string>
}

export interface TestInterface {
	args(): string[]
	input(): void
	check(output: TestResult, expected: TestResult): void
	parse?(stdout: string): string
}

export interface FullTestInterface extends TestInterface {
	stdin(): string
	line(str: string): void
	assertExactOutput(output: TestResult, expected: TestResult): void
}

// deno-lint-ignore no-explicit-any
export function Test<T extends { new (...args: any[]): TestInterface }>(Original: T) {
	return class extends Original implements FullTestInterface {
		#stdin = ""
		
		line(str: string) {
			return this.raw(str.concat("\n"))
		}

		raw(str: string) {
			this.#stdin = this.#stdin.concat(str)
			return this.#stdin
		}

		assertExactOutput(output: TestResult, expected: TestResult) {
			if (output.stdout !== expected.stdout) throw new Error("Incorrect output")
			if (output.meta.code !== expected.meta.code) throw new Error(`Program exited with ${output.meta.code}, when ${expected.meta.code} was expected`)
		}

		stdin(): string {
			super.input()
			return this.#stdin
		}
	};
}

