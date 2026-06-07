import { compilePackage } from "$src/tester/compiler.ts";
import cfg from "$src/utils/state.ts"

export async function compileCommand(pkg: string, options: { program: string }) {
    pkg = pkg ?? cfg.get("state.editingPackage")
    
    await compilePackage(pkg, options.program)
}