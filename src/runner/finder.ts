// This module is responsible for finding all tests in the workspace which meet given criteria,
// such as belonging to a package or a group

import { TestDescriptor } from "$types/tests.ts"

async function chdirToWorkspace(): Promise<boolean> {
	try {
		const res = await Deno.lstat(".utt")

		if (!res.isDirectory) throw new Deno.errors.NotADirectory()

		Deno.chdir(".utt")

		return true
	} catch (error) {
		if (
			error instanceof Deno.errors.NotADirectory ||
			error instanceof Deno.errors.NotFound
		) {
			if (Deno.cwd() == "/") return false

			Deno.chdir("..")
			return chdirToWorkspace()
		}

		throw new Error("I/O Error")
	}
}

async function dirExists(dir: string) {
	try {
		const res = await Deno.lstat(dir)

		if (!res.isDirectory) throw new Deno.errors.NotADirectory()

		return true
	} catch (error) {
		if (
			error instanceof Deno.errors.NotADirectory ||
			error instanceof Deno.errors.NotFound
		) {
			return false
		}

		throw new Error("I/O Error")
	}
}

export async function readWorkspace() {
	const success = await chdirToWorkspace()

	let tests: TestDescriptor[] = []

	if (success) {
		const dirs = Deno.readDir(Deno.cwd())

		for await (const dir of dirs) {
			if (!dir.isDirectory) continue

			const pkg = await readPackage(dir.name)

			tests = tests.concat(pkg)
		}
	}

	return tests
}

export async function readPackage(pkg: string) {
	await chdirToWorkspace()

	const success = await dirExists(pkg)

	let tests: TestDescriptor[] = []

	if (success) {
		const groups = Deno.readDir(pkg)

		for await (const dir of groups) {
			if (!dir.isDirectory) continue

			const group = await readGroup(pkg, dir.name)

			tests = tests.concat(group)
		}
	}

	return tests
}

export async function readGroup(pkg: string, group: string) {
	const path = [pkg, group].join("/")
	const success = await dirExists(path)

	const tests: TestDescriptor[] = []

	if (success) {
		const files = Deno.readDir(path)

		for await (const file of files) {
			if (!file.isFile) continue

			if (!file.name.endsWith(".ts")) continue

			const test = new TestDescriptor(pkg, group, file.name)

			tests.push(test)
		}
	}

	return tests
}
