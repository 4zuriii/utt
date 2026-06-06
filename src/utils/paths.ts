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

export async function getRoot() {
    return await findRoot(Deno.cwd())
}

export async function getWorkspace(): Promise<string> {
    return join(await getRoot(), '.utt')
}

export async function getTests() {
    const path = join(await getWorkspace(), 'tests')

    await ensureDir(path)

    return path
}

export async function getCreations() {
    const path = join(await getWorkspace(), 'creations')

    await ensureDir(path)

    return path
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
