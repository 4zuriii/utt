import type { BaseTest } from "$shared/base.ts"
import { resolve } from "@std/path"

export const collectFiles = Symbol("collectFiles")

type Constructor<T = object> = abstract new (...args: any[]) => T;

export const useFiles = function<T extends Constructor<BaseTest>>(Base: T) {
    abstract class WithFiles extends Base {
        #files!: Map<string, Promise<Uint8Array<ArrayBuffer>>>

        /**
         * Copies a file from your drive to the test file
         * @param testPath the path by which your program will access the file
         * @param realPath the real path to the file
         */
        importFile(testPath: string, realPath: string): void {
            const filePromise = Deno.readFile(resolve(realPath))

            this.#files.set(testPath, filePromise)
        }

        /**
         * Copies a file from your drive to the test file
         * @param testPath the path by which your program will access the file
         * @param realPath the real path to the file
         */
        textFile(testPath: string, content: string): void {
            this.#files.set(testPath, Promise.resolve(Buffer.from(content)))
        }

        /**
         * DO NOT USE IN YOUR TEST
         */
        async [collectFiles](): Promise<Map<string, ReadableStream<Uint8Array<ArrayBufferLike>>>> {
            this.#files = new Map()

            this.files?.()

            await Promise.all(this.#files.values())

            const res = new Map<string, ReadableStream<Uint8Array<ArrayBufferLike>>>()

            this.#files.entries().forEach(async ([k, v]) => {
                res.set(k, ReadableStream.from([await v]))
            })

            return res
        }
    }

    return WithFiles
}