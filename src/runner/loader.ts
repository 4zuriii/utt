import type { TestDescriptor, testTask } from "$types/tests.ts"
import type { FullTestInterface, Metadata, TestResult } from "$public/core.ts"
import { UntarStream } from "@std/tar/untar-stream"
import { toJson, toText } from '@std/streams'
import { encodeBase64Url } from '@std/encoding'

/**
 * Create an object of a class specified by `path`
 *
 * @param path path to the class, relative to `.utt/tests/` directory
 */
export async function loadTest(path: string): Promise<FullTestInterface> {

	const Test = (await import(path)).default

	return new Test()
}

export async function parseUtest(path: string) {
	const file = await Deno.open(path)

	const stream = file.readable.pipeThrough(new UntarStream())

	const result: {
		test: Partial<FullTestInterface>,
		expected: Partial<TestResult>
	} = { 
		test: {},
		expected: {
			files: new Map<string, string>()
		}
	 }

	for await (const file of stream) {
		if (!file.readable) continue

		if (file.path == 'test.ts') {
			const encoded = encodeBase64Url(await toText(file.readable))

			const test: FullTestInterface = await loadTest(`data:text/typescript;base64,${encoded}`)

			result.test = test
		} else if (file.path == "model.out") {
			result.expected.stdout = await toText(file.readable)
		} else if (file.path == "meta.json") {
			result.expected.meta = await toJson(file.readable) as Metadata
		} else {
			// ?. is ugly, but tsc won't stop bitching otherwise even though it's fine
			result.expected.files?.set(file.path, await toText(file.readable))
		}
	}

	return result as {
		test: FullTestInterface,
		expected: TestResult
	}
}

export async function prepareTasks(descriptors: TestDescriptor[]): Promise<testTask[]> {
	return await Promise.all(descriptors.map(createTask))
}

async function createTask(descriptor: TestDescriptor) {
	return {
		pkg: descriptor.pkg,
		group: descriptor.group,
		name: descriptor.name,
		obj: await loadTest(await descriptor.resolveClassPath()),
	}
}