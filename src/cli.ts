#!/usr/bin/env deno

import denoJson from '$/deno.json' with { type: "json" }
import { Command, Option, InvalidArgumentError, Argument } from "commander"
import { testCommand } from "$src/commands/test.ts"
import { createTestCommand, deleteTestCommand, setPackageCommand } from "$src/commands/editing.ts"
import { configCommand } from "$src/commands/config.ts"
import { compileCommand } from "$src/commands/compile.ts"
import { join } from "@std/path/join"
import { getRootDir } from "$src/utils/dirs.ts"
import cfg from "$src/utils/state.ts"

const program = new Command()

program.name("utt")
	.description(
		"Universal Testing Tool - easily write and run tests for any program",
	)
	.version(denoJson.version)

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
	.argParser(programParser)

function programParser(arg: string) {
	return join(
		Deno.cwd(),
		arg
	)
}

program.command("test")
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

program.command("config")
	.description("Configure utt for this project")
	.action(configCommand)

// PACKAGE COMMAND

program.command("package")
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

program.command("create")
	.description("Creates a test in the currently edited package")
	.addArgument(testNameArgument)
	.action(createTestCommand)

// DELETE COMMAND

program.command("delete")
	.description("Delete a test in the currently edited package")
	.addArgument(testNameArgument)
	.action(deleteTestCommand)

// COMPILE COMMAND

program.command("compile")
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

program.parse()
