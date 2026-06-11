import type { BaseTest } from "$shared/base.ts"

export const collectInput = Symbol("collectInput")

type Constructor<T = object> = abstract new (...args: any[]) => T;

class stdinStream {
	#controller!: ReadableStreamDefaultController
	#stream: ReadableStream

	constructor() {
		this.#stream = new ReadableStream({
			start: controller => {
				this.#controller = controller
			}
		})
	}

	push(text: string) {
		this.#controller.enqueue(Buffer.from(text))
	}

	flush(): ReadableStream {
		this.#controller.close()

		return this.#stream
	}
}

export const useInput = function<T extends Constructor<BaseTest>>(Base: T) {
    abstract class WithInput extends Base {
        #stdin!: stdinStream

        append(text: string): void {
            this.#stdin.push(text)
        }

        line(line: string): void {
            this.#stdin.push(line)
            this.#stdin.push("\n")
        }

        [collectInput](): ReadableStream<Uint8Array<ArrayBuffer>> {
            this.#stdin = new stdinStream()

            this.input?.()

            return this.#stdin.flush()
        } 
    }

    return WithInput
}