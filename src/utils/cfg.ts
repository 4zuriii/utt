import Conf from "conf"

import { getOrInitWorkspace } from "$src/utils/paths.ts"

type ConfigSchema = {
	program: string
	stats: string[]
}

const defaults: ConfigSchema = {
	program: "./program",
	stats: ["Real time", "Memory usage"],
}

const cfg = new Conf<ConfigSchema>({
	projectName: "utt",
	projectSuffix: "",
	cwd: await getOrInitWorkspace(),
	configName: 'utt-config',
	defaults,
})

export default cfg
