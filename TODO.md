# PRIORITY

- [ ] zip files need to contain both the state before and after the test, input files need to beard properly in the test running phase 
- [ ] advanced test status reporting
- [ ] the input stream needs to be dynamic, not load the entire stdin into memory
- [x] rewrite hash() to work as a pipe
- [x] rewrite test validators to use streams
- [x] rewrite loader.ts/runner.ts to work with new .utest format (.zip)
- [x] reporting the test status
- [x] break up sdk.ts (and the base Test class) into separate objects
- [x] hide test orchestration methods from the test writer by using Symbol

# PROGRAM

- [ ] implement push/pull
- [ ] clean up dependencies
- [ ] move test scripts back to .ts, transpiling with esbuild? or native deno?
- [ ] smaller executable (somehow)
- [ ] 'unpack' command to extract test file from a zip
- [ ] import the test file from a zip file using Blob objects / URL.createObject / URL.revokeObjectURL

# Test execution

- [ ] Parallel test running
- [ ] Output formatting
- [ ] Asynchronous test state reporting
- [ ] Performance tracking (/usr/bin/time, perf)
- [ ] Valgrind support
- [ ] rewrite runner/finder/compiler so that they can share code 
- [ ] the order of assertions in check() should not impact whether a test can finish - rewrite check() to return an object declaring how each thing should be asserted 
- [ ] keep test output flag

# SDK

- [ ] define() for creating objects
- [ ] Multi tests
- [ ] add a random number generator (the seed should probably be static, maybe file creation date? or some other file attribute)
- [ ] declaring timeout, valgrind, special input/output (/dev/full, /dev/random etc.) and other*
- [x] hash() function (parsing)
- [x] line()
- [x] rewrite parse (and other parts of the compiler/runner) to use streams

# NOTES

- * - should this even be in the sdk? maybe as validation methods? or a whole new field? also, has to be able to be disabled/override by the user with flags
- breaking up files into a mixin is left for {break up sdk.ts}
- by multi tests i mean a test that generates n (i. e. 100) instances of itself with randomized values, so esentially generators
- define(): in general, methods that make it easier to create input. For example, if the program requires us to create objects before they can
operate on them, there should be a helper to generate these creations/deletions automatically in the test
- push/pull refers to a system for uploading and downloading test packages. 
2 possibilities for this system are: 
a) a web server accepting GET/POST requests for gzipped tars containing .utest files. potential for abuse, and it has to be hosted somewhere (maybe on students?)
b) integration with git, would use git to create repos from a publicly available template, repos would be owned by whoever wrote the tests. Potentially unfeasable. A big plus for this solution is that it'd allow for automatic setting up of packages preloaded with the compiled binary alongside the tests, with no extra steps from the test author 
- order of assertions - the program won't quit unless it's stdout is unlocked (that is, it's read fully) and we can't read the exit code until the program quits. Therefore the reading of the output has to happen first (and always), but we should also give users the ability to implement their own validation logic, without them being able to deadlock the test runner. Possibly tee() could be helpful, or redesign the check() method 