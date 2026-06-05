#!/usr/bin/env deno

import { Command, Option } from 'commander'
import { testCommand } from "$src/commands/test.ts";
import { changeEditPackageCommand } from "$src/commands/editing.ts";

const program = new Command();

program.name('utt')
    .description("Universal Testing Tool - easily write and run tests for any program")
    .version('0.0.1')

const preserveOutputOption = new Option("--preserve-output [option]", "Should utt preserve output files after executing tests")
    .choices(["yes", "no", "fail"])
    .default("no")
    .preset("yes")

const statsOptions = new Option("--stats", "Specify stats to report")

program.command('test')
    .description("Runs tests")
    .argument("[package]", "Test package to run. Runs all found tests if no argument is specified")
    .addOption(preserveOutputOption)
    .option("--program, -p <program>", "Specify the path to the program being tested")
    .addOption(statsOptions)
    .action(testCommand)

program.command("edit")
    .description("Change which test package is being edited")
    .argument("<package>")
    .action(changeEditPackageCommand)



program.parse()