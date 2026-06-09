# PRIORITY

[x] rewrite hash() to work as a pipe
[] rewrite test validators to use streams
[] rewrite loader.ts/runner.ts to work with new .utest format (.zip)
[] reporting the test status
[] break up sdk.ts (and the base Test class) into separate objects

# MISC

[] clean up dependencies
[] move test scripts back to .ts, transpiling with esbuild? or native deno?

# Test execution

[] Parallel test running
[] Output formatting
[] Asynchronous test state reporting
[] Performance tracking (/usr/bin/time, perf)
[] Valgrind support
[] rewrite runner/finder/compiler so that they can share code 

# SDK

[x] hash() function (parsing)
[x] line()
[] define() for creating objects
[] rewrite parse (and other parts of the compiler/runner) to use streams
