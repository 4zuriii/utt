import { Test } from "utt"

export default class extends Test {
    // Pass arguments to the program
    args() {
        return [ "" ];
    }
    
    // Generate the input
    // see docs for helpers to create the input
    input() {
        this.line("A line on standard input")
    }

    // optional: parse the output
    // parse(stdout) {
    //     return this.hash(stdout)   
    // }    
    

    // Verify that the test passed succesfully
    // use a helper or write the logic yourself
    check(output, expected) {
        this.assertExactOutput(output, expected)
    }
}
