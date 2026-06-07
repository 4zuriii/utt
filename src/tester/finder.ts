// This module is responsible for finding all tests in the workspace which meet given criteria,
// such as belonging to a package or a group

import { TestDescriptor } from "$types/tests.ts"
import { getTestsDir } from "$src/utils/dirs.ts"
import { join } from "@std/path/join"
import { parse } from "@std/path/parse"

export async function readAll() {
	const path = await getTestsDir()

	let tests: TestDescriptor[] = []
	const dirs = Deno.readDir(path)

	for await (const dir of dirs) {
		if (!dir.isDirectory) continue

		const pkg = await readPackage(dir.name, path)

		tests = tests.concat(pkg)
	}

	return tests
}

export async function readPackage(pkg: string, path?: string | undefined) {
	path = path ?? await getTestsDir()

	let tests: TestDescriptor[] = []

	const groups = Deno.readDir(join(path, pkg))

	for await (const dir of groups) {
		if (!dir.isDirectory) continue

		const group = await readGroup(pkg, dir.name, path)

		tests = tests.concat(group)
	}

	tests = tests.concat(await readGroup(pkg, '', path))

	return tests
}

async function readGroup(pkg: string, group: string, path: string) {
	const tests: TestDescriptor[] = []

	const files = Deno.readDir(join(path, pkg, group))

	for await (const file of files) {
		const f = parse(file.name)

		if (!file.isFile) continue
		if (f.ext !== ".utest") continue

		const test = new TestDescriptor(pkg, group, f.name)

		tests.push(test)
	}

	return tests
}
