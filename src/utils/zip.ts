import { ZipWriter } from "@zip-js/zip-js";
import { UTEST_FILES_DIR } from "$utils/constants.ts";

export class ZipFile {
    private writer: ZipWriter<WritableStream<Uint8Array>>

    constructor(writable: WritableStream) {
        this.writer = new ZipWriter(writable)

        // ensure the directory exists inside the zip file, since it wont if not files are written
        this.writer.add(UTEST_FILES_DIR, undefined, {
            directory: true
        })
    }

    async addFile(path: string, file: ReadableStream): Promise<void> {
        await this.writer.add(path, file)
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await this.writer.close()
    }
}

