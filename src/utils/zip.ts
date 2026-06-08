import { ZipWriter, terminateWorkers } from "@zip-js/zip-js";

export class ZipFile {
    private writer: ZipWriter<WritableStream<Uint8Array>>

    constructor(writable: WritableStream) {
        this.writer = new ZipWriter(writable)

        // ensure the env/ directory exists inside the zip file
        this.writer.add("env/", undefined, {
            directory: true
        })
    }

    async addFile(path: string, file: ReadableStream): Promise<void> {
        await this.writer.add(path, file)
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await this.writer.close()
        await terminateWorkers()
    }
}

