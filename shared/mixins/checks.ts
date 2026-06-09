// deno-lint-ignore-file no-explicit-any
import streamEqual from "stream-equal"
import { Readable } from "node:stream"
import type { BaseTest } from "$shared/base.ts"
import type { TestOutput } from "utt"

type Constructor<T = object> = abstract new (...args: any[]) => T;

export const useChecks = function<T extends Constructor<BaseTest>>(Base: T) {
    abstract class WithChecks extends Base {
        async assertExact(output: TestOutput, expected: TestOutput): Promise<void> {
            // this has to be the first check, since if the output buffer fills up,
            // the test will never finish and let us check the exit code
            await this.assertExactStdOut(output, expected)
            await this.assertExactCode(output, expected)
        }

        async assertExactCode(output: TestOutput, expected: TestOutput): Promise<void> {
            if ((await output.status).code !== (await expected.status).code) {
                // these won't be read so we need to close them manually before throwing
                throw new Error(
                    `Program exited with ${(await output.status).code}, when ${(await expected.status).code} was expected`
                )
            }
        }

        async assertSuccessCode(output: TestOutput): Promise<void> {
            if ((await output.status).code !== 0) {
                // these won't be read so we need to close them manually before throwing
                throw new Error(
                    `Program exited with ${(await output.status).code}, when 0 was expected`
                )
            }
        }

        async assertErrorCode(output: TestOutput): Promise<void> {
            if ((await output.status).code == 0) {
                // these won't be read so we need to close them manually before throwing
                throw new Error(
                    `Program exited with 0, when an error code was expected`
                )
            }
        }

        async assertExactStdOut(output: TestOutput, expected: TestOutput): Promise<void> {
            const res = await streamEqual(
                Readable.fromWeb(output.out as any),
                Readable.fromWeb(expected.out as any)
            )

            if (!res) throw new Error("The output of the test doesn't match the expected value")
        }
    }

    return WithChecks
}