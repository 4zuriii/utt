import { compilePackage } from "$src/tester/compiler.ts";
import { terminateWorkers } from "@zip-js/zip-js"
import cfg from "$utils/state.ts"
import { bold, brightGreen, red } from "@std/fmt/colors"
import { program } from "$src/cli.ts"
import { join } from "@std/path"
import { getSrcDir } from "$utils/dirs.ts"
import { exists } from "@std/fs/exists"

export async function compileCommand(pkg: string, options: { program: string }) {
    if (!pkg && !cfg.get("state.editingPackage")) {
        program.error(red(bold("You are not editing a package. Run '$ utt package' or specify the package to compile by passing an argument")))
    }
    
    pkg = pkg ?? cfg.get("state.editingPackage")
    
    if (!await exists(join(await getSrcDir(), pkg))) {
        cfg.set("state.editingPackage", "")
        program.error(red(bold(`Package ${pkg} doesn't exist`)))
        
    }
    
    await compilePackage(pkg, options.program)

    await terminateWorkers()    // otherwise the program will wait 5 seconds before exiting

    console.log(brightGreen(`[SUCCESS] Compiled package: ${bold(pkg)}`))
}