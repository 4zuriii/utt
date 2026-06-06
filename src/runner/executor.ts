import type { ITest } from "$public/TestInterface.ts"
import SampleTest from "$/.utt/src/pkg/sample.ts"

// runs a test and returns its output
export async function executeTask(program: string, cwd: string, test: ITest) {
	const command = new Deno.Command(program, {
		stdin: "piped",
		stdout: "piped",
		args: test.args(),
		cwd
	})

	const instance = command.spawn()
	
	const writer = instance.stdin.getWriter()
	writer.write(new TextEncoder().encode(test.stdin()))
	writer.close()

	const { code, stdout } = await instance.output()

	let out = new TextDecoder().decode(stdout)
	if (test.parse) out = test.parse(out)

	return {
		out,
		meta: {
			code
		}
	}
}

// export async function executeTasksList(list: )

if (import.meta.main) {
    const res = await executeTask(
        './program',
        '.',
        new SampleTest()
    )

    console.log(res)
}