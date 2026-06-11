import { getSrcDir, assertDir } from "$utils/dirs.ts"
import { ensureDir } from "@std/fs"
import { join } from "@std/path"
import cfg from "$utils/state.ts"
import template from "$src/templates/test.js" with { type: "text" }
import { bold, brightGreen, brightRed } from "@std/fmt/colors"
import { app } from "$src/cli.ts"

export async function setPackageCommand(pkg: string) {
	const path = join(await getSrcDir(), pkg)

	await ensureDir(path)

	cfg.set("state.editingPackage", pkg)
}

export async function createTestCommand({ name, group }: { name: string, group?: string }) {
	const pkg = cfg.get("state.editingPackage")

	let path = join(
		await getSrcDir(),
		pkg
	)

	await assertDir(path)

	if (group) path = join(path, group)

	const fullName = group ? group + "." + name : name

	await ensureDir(path)

	// Currently, this relies on the cli being run from the directory of the project
	// TODO: decouple this
	await Deno.writeTextFile(join(path, name + ".js"), template, {
		create: true
	}).catch((e: Error) => {
		app.error(`Failed to create test ${fullName}: ${e.message}`)
	})

	console.log(brightGreen(`Created test ${bold(fullName)} in package ${bold(pkg)}`))
}

async function dirIsEmpty(dir: AsyncIterable<Deno.DirEntry>) {
	for await (const _ of dir) {
		return false;
	}

	return true;
}

export async function deleteTestCommand({ name, group }: { name: string, group?: string }) {
	const pkg = cfg.get("state.editingPackage")
	
	let path = join(
		await getSrcDir(),
		pkg
	)

	await assertDir(path)

	if (group) path = join(path, group)

	const fullName = group ? group + "." + name : name

	try {
		await Deno.remove(join(path, name.concat(".js")))

		if (group && await dirIsEmpty(Deno.readDir(path))) {
			Deno.remove(path)
		}
		console.log(brightGreen(`Deleted test ${bold(fullName)} in package ${bold(pkg)}`))
	} catch (_) {
		console.log(brightRed(`Test ${bold(fullName)} doesn't exist in package ${bold(pkg)}`))
	} 
}

