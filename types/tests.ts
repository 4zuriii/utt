import type Test from "$public/TestInterface.ts"

export class TestDescriptor {
	#className: string
	#pkg: string
	#group: string

	constructor(pkg: string, group: string, className: string) {
		this.#pkg = pkg, this.#group = group, this.#className = className
	}

	get pkg() {
		return this.#pkg
	}

	get group() {
		return this.#group
	}

	get className() {
		return this.#className
	}

	resolveClassPath() {
		return [this.#pkg, this.#group, this.#className].join("/")
	}
}

export type testTask = {
	pkg: string
	group: string
	name: string
	obj: Test
}
