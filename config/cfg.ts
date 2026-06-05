import Conf from "conf"
import denoJson from '$/deno.json' with { type: 'json' }

type ConfigSchema = {
    program: string
}

const cfg = new Conf<ConfigSchema>({ projectName: denoJson.name })

export default cfg
