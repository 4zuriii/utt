import { dirname, join, resolve } from '@std/path'
import { ensureDir, exists } from '@std/fs'
import { UTT_DIST_DIR, UTT_SRC_DIR, UTT_TESTS_DIR, UTT_WORKSPACE_DIR } from "$utils/constants.ts"

async function findRoot(path: string): Promise<string> {
    if (path == '/') throw new Error("Project not found")

    const res = await exists(join(path, UTT_WORKSPACE_DIR), { isDirectory: true })

    if (res) {
        return path
    } else {
        return findRoot(dirname(path))
    }
}

export async function getRootDir() {
    return await findRoot(Deno.cwd())
}

export async function getWorkspace(): Promise<string> {
    return join(await getRootDir(), UTT_WORKSPACE_DIR)
}

async function getDir(folder: string) {
    const path = join(await getWorkspace(), folder)

    await ensureDir(path)

    return path
}

export async function getTestsDir() {
    return await getDir(UTT_TESTS_DIR)
}

export async function getSrcDir() {
    return await getDir(UTT_SRC_DIR)
}

export async function getDistDir() {
    return await getDir(UTT_DIST_DIR)
}

export async function getOrInitWorkspace(): Promise<string> {
    try {
        const res = await getWorkspace()

        return res
    } catch (_e) {
        Deno.mkdirSync(UTT_WORKSPACE_DIR)

        return resolve(UTT_WORKSPACE_DIR)
    }
}

export async function assertDir(path: string, msg?: string) {
    if (!await exists(path, { isDirectory: true })) throw new Error(msg ?? '')
}
