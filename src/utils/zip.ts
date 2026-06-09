import { ZipWriter } from "@zip-js/zip-js";

export class ZipFile {
    #writer: ZipWriter<WritableStream<Uint8Array>>

    constructor(writable: WritableStream) {
        this.#writer = new ZipWriter(writable, {
            compressionMethod: 0
        })
    }

    async addFile(path: string, file: ReadableStream, comment: "file" | "meta" = "file"): Promise<void> {
        await this.#writer.add(path, file, { comment })
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await this.#writer.close()
    }
}

