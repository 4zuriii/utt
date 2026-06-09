import { compilePackage } from "$src/tester/compiler.ts";
import { terminateWorkers } from "@zip-js/zip-js"
import cfg from "$src/utils/state.ts"

export async function compileCommand(pkg: string, options: { program: string }) {
    pkg = pkg ?? cfg.get("state.editingPackage")
    
    await compilePackage(pkg, options.program)

    await terminateWorkers()    // otherwise the program will wait 5 seconds before exiting
}