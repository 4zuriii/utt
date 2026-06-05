import Conf from "conf"

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
	configName: Deno.cwd().replace("/", "").replaceAll("/", "."),
	defaults,
})

export default cfg
