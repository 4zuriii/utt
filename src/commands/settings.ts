import cfg from "$src/utlis/cfg.ts"
import { checkbox, input, select, Separator } from "@inquirer/prompts"

enum Page {
	settings = "SETTINGS",
	close = "CLOSE",
	program = "PROGRAM",
	stats = "STATS",
}

export async function settingsCommand() {
	let setting: Page = Page.settings

	while (true) {
		if (setting == Page.settings) {
			setting = await settingsPage()
		} else if (setting == Page.program) {
			setting = await programPage()
		} else if (setting == Page.stats) {
			setting = await statsPage()
		} else {
			break
		}
	}
}

async function settingsPage() {
	const setting = await select({
		message: "Edit settings",
		choices: [
			new Separator(),
			{
				name: "Tested executable",
				value: Page.program,
				description: cfg.get("program"),
			},
			{
				name: "Configure displayed stats",
				value: Page.stats,
				description: cfg.get("stats")?.join(", "),
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
	const currentSettings = cfg.get("stats")

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

	cfg.set("stats", res)

	return Page.settings
}

async function programPage(): Promise<Page> {
	const value = await input({
		message: "Enter the path to the tested program",
		default: cfg.get("program"),
	}, {
		clearPromptOnDone: true,
	})

	cfg.set("program", value)

	return Page.settings
}
