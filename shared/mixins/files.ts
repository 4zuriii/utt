import type { BaseTest } from "$shared/base.ts"

export const collectFiles = Symbol("collectFiles")
export const toDiscard = Symbol("toDiscard")

export type FilesObject = {
    dynamicFiles: { testPath: string, readable: ReadableStream<Uint8Array> }[],
    importedFiles: { testPath: string, realPath: string }[]
}

type Constructor<T = object> = abstract new (...args: any[]) => T;

export const useFiles = function<T extends Constructor<BaseTest>>(Base: T) {
    abstract class WithFiles extends Base {
        #dynamicFiles!: FilesObject["dynamicFiles"]
        #importedFiles!: FilesObject["importedFiles"]
        #toDiscard!: string[]

        /**
         * Copies a file from your drive to the test file
         * @param testPath the path by which your program will access the file
         * @param realPath the real path to the file
         */
        importFile(testPath: string, realPath: string, discard: boolean = false) {
            this.#importedFiles.push({ testPath, realPath })
            if (discard) this.#toDiscard.push(realPath)
        }

        /**
         * Copies a file from your drive to the test file
         * @param testPath the path by which your program will access the file
         * @param realPath the real path to the file
         */
        textFile(testPath: string, text: string, discard: boolean = false): void {
            this.#dynamicFiles.push({ testPath, readable: new Blob([text]).stream()})
            if (discard) this.#toDiscard.push(testPath)
        }

        [collectFiles](): FilesObject {
            this.#importedFiles = []
            this.#dynamicFiles = []
            this.#toDiscard = []

            this.files?.()

            return {
                importedFiles: this.#importedFiles,
                dynamicFiles: this.#dynamicFiles
            }
        }

        [toDiscard](): string[] {
            return this.#toDiscard
        }
    }

    return WithFiles
}