import { ServiceConfig } from "../types/general";
import { configStats, startStats } from "./stats";
import { ipStart } from "./update";

const startService = async (config: ServiceConfig) => {

    // Start IP Service
    await ipStart(config);

    // Config Stats
    configStats(config);

    // Start Stats
    startStats();
};

export {
    startService,
}