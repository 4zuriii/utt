export async function makeTemp() {
    // TODO: use /dev/shm/ instead of tmp/ if on linux
    return await Deno.makeTempDir({ prefix: 'utt-' })
}