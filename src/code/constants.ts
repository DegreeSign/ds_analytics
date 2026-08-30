import { oneSec } from "@degreesign/utils";
import { countriesCodes } from "./countries";
import { CountryCode } from "../types/country";
import { RateLimits } from "../types/ip";
import { StatsConfig } from "../types/stats";
import { WebConfig } from "../types/web";

const
    /** IP range source */
    ipSourceUrl: string = "https://cdn.jsdelivr.net/npm/@ip-location-db/dbip-country/dbip-country-ipv4-num.csv",
    /** Unknown country code */
    unknownCountryCode: CountryCode = `UN`,
    /** IP rate limits */
    ipRateLimits: RateLimits = {
        generalAccess: 20,
        whiteListed: 100,
        priorityAccess: 500,
    },
    checkInterval = 5e3,
    checkIntervalMax = oneSec * 300,
    /** Traffic cache TTL for eviction (5 minutes) */
    trafficDataCacheTtl = oneSec * 300,
    uriCorrupt = /[:%\s]|.html/, // checks for : % space or .html
    statsConfig: StatsConfig = {
        trafficDir: `traffic`,
        thisDomain: ``,
        excludeURIs: [],
        searchEngines: [],
        uriAlias: {},
    },
    webConfig: WebConfig = {
        checkInterval: checkInterval,
    };

export {
    ipSourceUrl,
    unknownCountryCode,
    CountryCode,
    countriesCodes,
    ipRateLimits,

    checkInterval,
    checkIntervalMax,
    trafficDataCacheTtl,
    uriCorrupt,
    statsConfig,

    webConfig,
}