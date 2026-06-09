import { useInput } from "$shared/mixins/input.ts"
import { BaseTest } from "$shared/base.ts"

export type Metadata = {
	code: number
}

export type TestOutput = {
		out: ReadableStream<Uint8Array>,
		status: Deno.ChildProcess["status"],
		stats: {},
		files: Map<string, ReadableStream<Uint8Array>>
}

const composition = useInput(BaseTest)

export interface Test extends InstanceType<typeof composition> {}

export const Test: abstract new (...args: ConstructorParameters<typeof BaseTest>) => Test = composition;

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