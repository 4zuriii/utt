import type { FullTestInterface, TestInterface, TestResult } from "utt"
import { TestDec } from "utt"

@TestDec
class TestClass implements TestInterface {
    // Pass arguments to the program
    args(): string[] {
        return [ "" ];
    }
    
    // Generate the input
    // see docs for helpers to create the input
    input(): void {
        this.line("A line of standard input")
    }

    // optional: parse the output
    // parse(stdout: string): string {
    //     return this.hash(stdout)   
    // }    

    // Verify that the test passed succesfully
    // use a helper or write the logic yourself
    check(output: TestResult, expected: TestResult): void {
        this.assertExactOutput(output, expected)
    }
}

interface TestClass extends FullTestInterface {}
export default TestClass