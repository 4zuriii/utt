import { ZipWriter } from "@zip-js/zip-js";
import { join } from "@std/path"
export class ZipFile {
    #writer: ZipWriter<WritableStream<Uint8Array>>

    constructor(writable: WritableStream) {
        this.#writer = new ZipWriter(writable, {
            compressionMethod: 0,
            
        })
        this.#writer.add("in/", undefined, { directory: true })
        this.#writer.add("out/", undefined, { directory: true })
    }

    async addFile(path: string, file: ReadableStream, prefix: "" | "in" | "out" = ""): Promise<void> {
        await this.#writer.add(join(prefix, path), file)
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await this.#writer.close()
    }
}

