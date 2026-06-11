#!/usr/bin/env deno

import denoJson from '$/deno.json' with { type: "json" }
import { Command, Option, InvalidArgumentError, Argument } from "commander"
import { testCommand } from "$src/commands/test.ts"
import { createTestCommand, deleteTestCommand, setPackageCommand } from "$src/commands/editing.ts"
import { configCommand } from "$src/commands/config.ts"
import { compileCommand } from "$src/commands/compile.ts"
import { join } from "@std/path/join"
import { getRootDir } from "$src/utils/dirs.ts"
import cfg from "$utils/state.ts"
import { resolve } from "@std/path/resolve"
import { bold, red } from "@std/fmt/colors"

export const app = new Command()

app.name("utt")
	.description(
		"Universal Testing Tool - easily write and run tests for any program",
	)
	.version(denoJson.version)
	.configureOutput({
		outputError: (str, write) => {
			write(red(bold("[ERROR] " + str)))
		}
	})

// TEST COMMAND

const preserveOutputOption = new Option(
	"--preserve-output [option]",
	"Should utt preserve output files after executing tests",
)
	.choices(["yes", "no", "fail"])
	.default("no")
	.preset("yes")

const statsOptions = new Option("--stats", "Specify stats to report")

const programOption = new Option("--program, -p <path>", "Specify the path to the tested program")
	.default(
		join(
			await getRootDir(),
			cfg.get("cfg.program")
		)
	)
	.argParser(path => resolve(path))

app.command("test")
	.description("Runs tests")
	.argument(
		"[package]",
		"Test package to run. Runs all found tests if no argument is specified",
	)
	.addOption(preserveOutputOption)
	.addOption(programOption)
	.addOption(statsOptions)
	.action(testCommand)
	
// CONFIG COMMAND

app.command("config")
	.description("Configure utt for this project")
	.action(configCommand)

// PACKAGE COMMAND

app.command("package")
	.description("Select package to work on")
	.argument("<package>")
	.action(setPackageCommand)

// CREATE COMMAND

const testNameArgument = new Argument("<name>",
	 "Specify the name of the test. use the dot syntax to put a test in the group: group.name"
	)
	.argParser(nameParser)

function nameParser(str: string) {
	// if name includes a dot like so: group.name, we want to create a test in the group,
	// otherwise, create the test in the root of the package

	if (str.includes(".")) {
		const [ group, name, extra ] = str.split(".")

		if (extra) throw new InvalidArgumentError("You can use the dot syntax to specify the group of the created test like so: group.name")

		return {
			group, name
		}
	} else {
		return { name: str }
	}
}

app.command("create")
	.description("Creates a test in the currently edited package")
	.addArgument(testNameArgument)
	.action(createTestCommand)

// DELETE COMMAND

app.command("delete")
	.description("Delete a test in the currently edited package")
	.addArgument(testNameArgument)
	.action(deleteTestCommand)

// COMPILE COMMAND

app.command("compile")
	.description("Compile a package into .utest files")
	.argument("[package]")
	.addOption(programOption)
	.action(compileCommand)

/*
// PEEK COMMAND
program.command("peek")
	.description("Generate raw files from a given .utest file")
	.argument("<path>")
	.action(peekCommand)
*/

app.parse()
