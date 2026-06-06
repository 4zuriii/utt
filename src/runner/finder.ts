// This module is responsible for finding all tests in the workspace which meet given criteria,
// such as belonging to a package or a group

import { TestDescriptor } from "$types/tests.ts"
import { getTests } from "$src/utils/paths.ts"
import { join } from "@std/path/join"

async function assertDir(dir: string) {
	const res = await Deno.lstat(dir)

	if (!res.isDirectory) throw new Deno.errors.NotADirectory()
}

export async function readAll() {
	const path = await getTests()

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
	if (!path) {
		path = await getTests()
	}

	let tests: TestDescriptor[] = []

	const groups = Deno.readDir(join(path, pkg))

	for await (const dir of groups) {
		if (!dir.isDirectory) continue

		const group = await readGroup(pkg, dir.name, path)

		tests = tests.concat(group)
	}

	return tests
}

async function readGroup(pkg: string, group: string, path: string) {
	const tests: TestDescriptor[] = []

	const files = Deno.readDir(join(path, pkg, group))

	for await (const file of files) {
		if (!file.isFile) continue

		if (!file.name.endsWith(".ts")) continue

		const test = new TestDescriptor(pkg, group, file.name)

		tests.push(test)
	}

	return tests
}
