import cfg from "$src/utils/state.ts"
import { checkbox, input, select, Separator } from "@inquirer/prompts"
import { exists } from "@std/fs/exists"
import { resolve } from "@std/path/resolve"

enum Page {
	main = "MAIN",
	close = "CLOSE",
	program = "PROGRAM",
	stats = "STATS",
}

export async function configCommand() {
	let setting: Page = Page.main

	while (true) {
		if (setting == Page.main) {
			setting = await configPage()
		} else if (setting == Page.program) {
			setting = await programPage()
		} else if (setting == Page.stats) {
			setting = await statsPage()
		} else {
			break
		}
	}
}

async function configPage() {
	const setting = await select({
		message: "Edit config",
		choices: [
			new Separator(),
			{
				name: "Tested executable",
				value: Page.program,
				description: cfg.get("cfg.program"),
			},
			{
				name: "Configure displayed stats",
				value: Page.stats,
				description: cfg.get("cfg.stats")?.join(", "),
			},
			new Separator(),
			{
				name: "Close",
				value: Page.close,
				description: "Close this menu",
			},
		],
	}, {
		clearPromptOnDone: true,
	})

	return setting
}

async function statsPage(): Promise<Page> {
	const currentSettings = cfg.get("cfg.stats")

	function choice(value: string) {
		return {
			value,
			checked: currentSettings?.includes(value),
		}
	}

	const res = await checkbox({
		message: "Select stats to track",
		choices: [
			choice("Real time"),
			choice("System time"),
			choice("User time"),
			choice("Memory usage"),
		],
	}, {
		clearPromptOnDone: true,
	})

	cfg.set("cfg.stats", res)

	return Page.main
}

async function programPage(): Promise<Page> {
	const value = await input({
		message: "Enter the path to the tested program",
		default: cfg.get("cfg.program"),
		required: true,
		prefill: "editable",
		validate: async (path) => {
			return await exists(resolve(path)) ? true : "This program doesn't exist" 
		}
	}, {
		clearPromptOnDone: true,
	})

	cfg.set("cfg.program", value)

	return Page.main
}
