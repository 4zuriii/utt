import { TestExecutionSymbols } from "$utils/types.ts"
import { yellow } from "@std/fmt/colors"
import { join } from "@std/path/join"
import type { Test } from "utt"

export async function makeEnv() {
    // TODO: use /dev/shm/ instead of tmp/ if on linux
    return await Deno.makeTempDir({ prefix: 'utt-' })
}

export async function deleteEnv(env: string) {
    await Deno.remove(env, { recursive: true })
}

export async function discardFiles(test: Test, env: string) {
	const toDiscard = test[TestExecutionSymbols.toDiscard]()

    for (const path of toDiscard) {
        try {
            await Deno.remove(join(env, path))
        } catch (e) {
            if (e instanceof Deno.errors.NotFound) {
                console.log(yellow(`[WARNING]: File ${path} was deleted`))
                return
            }

            throw e
        }
    }
}