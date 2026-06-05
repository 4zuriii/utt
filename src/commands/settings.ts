import cfg from '$config/cfg.ts'
import { select } from '@inquirer/prompts';

export async function settingsCommand() {
    const setting = await select({
        message: "Edit settings",
        choices: [
            {
                name: "Tested executable",
                value: "program",
                description: cfg.get("program")
            }
        ]
    })

    console.log(setting)
}