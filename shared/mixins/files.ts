import type { BaseTest } from "$shared/base.ts"

export const collectFiles = Symbol("collectFiles")

type Constructor<T = object> = abstract new (...args: any[]) => T;

export const useFiles = function<T extends Constructor<BaseTest>>(Base: T) {
    abstract class WithFiles extends Base {
        #files!: Map<string, Promise<ReadableStream<Uint8Array<ArrayBuffer>>> | ReadableStream<Uint8Array<ArrayBuffer>>>

        /**
         * Copies a file from your drive to the test file
         * @param testPath the path by which your program will access the file
         * @param realPath the real path to the file
         */
        importFile(testPath: string, realPath: string) {
            this.#files.set(testPath, new Promise((resolve, reject) => {
                Deno.open(realPath).then((file: Deno.FsFile) => {
                    resolve(file.readable)
                }).catch(reason => reject(reason))             
            }))
        }

        /**
         * Copies a file from your drive to the test file
         * @param testPath the path by which your program will access the file
         * @param realPath the real path to the file
         */
        textFile(testPath: string, content: string): void {
            this.#files.set(testPath, Promise.resolve(new Blob([content]).stream()))
        }

        async [collectFiles](): Promise<Map<string, ReadableStream<Uint8Array<ArrayBufferLike>>>> {
            this.#files = new Map()

            this.files?.()

            // resolve all promises
            for (const [k, v] of this.#files) {
                this.#files.set(k, await v)
            }
        
            return this.#files as Map<string, ReadableStream<Uint8Array<ArrayBufferLike>>>
        }
    }

    return WithFiles
}