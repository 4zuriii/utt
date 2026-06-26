// This module is responsible for finding all tests in the workspace which meet given criteria,
// such as belonging to a package or a group

import { getSrcDir, getTestsDir } from "$utils/dirs.ts"
import { join } from "@std/path/join"
import { UTEST_EXT, UTEST_TEST_EXT } from "$utils/constants.ts"
import { basename, parse } from "@std/path"

export abstract class TestDescriptor {
	static create(pkg: string, group: string, filename: string): TestDescriptor | null {
		const { name, ext } = parse(filename)

		if (ext == UTEST_EXT) {
			return new CompiledTD(pkg, group, name)
		} else if (ext == UTEST_TEST_EXT) {
			return new UncompiledTD(pkg, group, name)
		}

		return null
	}
	
	#name: string
	#pkg: string
	#group: string

	constructor(pkg: string, group: string, name: string) {
		this.#name = basename(name)
		this.#pkg = pkg
		this.#group = group
	}

	protected get pkg() {
		return this.#pkg
	}

	protected get group() {
		return this.#group
	}

	protected get name() {
		return this.#name
	}

	get testName() {
		if (this.#group) {
			return this.#group + "." + this.#name
		} else {
			return this.#name
		}
	}

	abstract resolveClassPath(): Promise<string>
}

class UncompiledTD extends TestDescriptor {
	override async resolveClassPath(): Promise<string> {
		return join(await getSrcDir(), this.pkg, this.group, this.name.concat(UTEST_TEST_EXT))
	}
}

class CompiledTD extends TestDescriptor {
	override async resolveClassPath(): Promise<string> {
		return join(await getTestsDir(), this.pkg, this.group, this.name.concat(UTEST_EXT))
	}
}

export async function readAll(path: string) {
	let tests: TestDescriptor[] = []
	const dirs = Deno.readDir(path)

	for await (const dir of dirs) {
		if (!dir.isDirectory) continue

		const pkg = await readPackage(path, dir.name)

		tests = tests.concat(pkg)
	}

	return tests
}

export async function readPackage(path: string, pkg: string,) {
	let tests: TestDescriptor[] = []

	const groups = Deno.readDir(join(path, pkg))

	for await (const dir of groups) {
		if (!dir.isDirectory) continue

		const group = await readGroup(path, pkg, dir.name)

		tests = tests.concat(group)
	}

	tests = tests.concat(await readGroup(path, pkg))

	return tests
}

async function readGroup(path: string, pkg: string, group: string = "") {
	const tests: TestDescriptor[] = []

	const files = Deno.readDir(join(path, pkg, group))

	for await (const file of files) {
		if (!file.isFile) continue

		const test = TestDescriptor.create(pkg, group, file.name)

		if (test) tests.push(test)
	}

	return tests
}
