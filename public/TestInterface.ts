export default interface Test {
	args(): string[]
	stdin(): string
	check(stdout: string, status: number): boolean
}
