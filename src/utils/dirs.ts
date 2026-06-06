import { dirname, join } from '@std/path'
import { ensureDir, exists } from '@std/fs'

async function findRoot(path: string): Promise<string> {
    if (path == '/') throw new Error("Project not found")

    const res = await exists(join(path, '.utt'), { isDirectory: true })

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
    return join(await getRootDir(), '.utt')
}

async function getDir(folder: string) {
    const path = join(await getWorkspace(), folder)

    await ensureDir(path)

    return path
}

export async function getTestsDir() {
    return await getDir('tests')
}

export async function getSrcDir() {
    return await getDir('src')
}

export async function getDistDir() {
    return await getDir('dist')
}

export async function getOrInitWorkspace(): Promise<string> {
    try {
        const res = await getWorkspace()

        return res
    } catch (_e) {
        Deno.mkdirSync('.utt')

        return join(Deno.cwd(), '.utt')
    }
}

export async function assertDir(path: string, msg?: string) {
    if (!await exists(path, { isDirectory: true })) throw new Error(msg ?? '')
}
