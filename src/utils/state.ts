import Conf from "conf"

import { getOrInitWorkspace } from "$src/utils/dirs.ts"

type ConfigSchema = {
	program: string
	stats: string[]
}

type StateSchema = {
	editingPackage: string
}

type Schema = {
	cfg: ConfigSchema,
	state: StateSchema
}

const defaults: Schema = {
	cfg: {
		program: "./program",
		stats: ["Real time", "Memory usage"],
	},
	state: {
		editingPackage: ""
	}
}

const cfg = new Conf<Schema>({
	projectName: "utt",
	projectSuffix: "",
	cwd: await getOrInitWorkspace(),
	configName: 'utt-config',
	defaults,
})

export default cfg
