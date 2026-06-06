import { join, toFileUrl } from "@std/path"
import type { TestDescriptor, testTask } from "$types/tests.ts"
import { getTests } from "$src/utils/paths.ts"

/**
 * Load a Test Class from a given path
 *
 * @param path path to the class, relative to `.utt/tests/` directory
 */
export async function loadTest(path: string) {
	const absolutePath = join(await getTests(), path)
	const moduleUrl = toFileUrl(absolutePath).href

	const Test = (await import(moduleUrl)).default

	return new Test()
}

export async function prepareTasks(descriptors: TestDescriptor[]): Promise<testTask[]> {
	return await Promise.all(descriptors.map(createTask))
}

async function createTask(descriptor: TestDescriptor) {
	return {
		pkg: descriptor.pkg,
		group: descriptor.group,
		name: descriptor.className.split(".")[0],
		obj: await loadTest(descriptor.resolveClassPath()),
	}
}