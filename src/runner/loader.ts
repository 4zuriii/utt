import { join, toFileUrl } from "@std/path"
import type { TestDescriptor, testTask } from "$types/tests.ts"

/**
 * Load a Test Class from a given path
 *
 * @param path path to the class, relative to `Deno.cwd()`
 */
export async function loadTest(path: string) {
	const absolutePath = join(Deno.cwd(), path)
	const moduleUrl = toFileUrl(absolutePath).href

	const Test = (await import(moduleUrl)).default

	return new Test()
}

export async function prepareTasks(
	descriptors: TestDescriptor[],
): Promise<testTask[]> {
	return await Promise.all(descriptors.map(async (descriptor) => {
		const task: testTask = {
			pkg: descriptor.pkg,
			group: descriptor.group,
			name: descriptor.className.split(".")[0],
			obj: await loadTest(descriptor.resolveClassPath()),
		}

		return task
	}))
}
