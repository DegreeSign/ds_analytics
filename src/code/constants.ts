import { oneMin, oneSec } from "@degreesign/utils";
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
        generalAccess: 100,
        whiteListed: 500,
        priorityAccess: 3000,
    },
    checkInterval = 5e3,
    checkIntervalMax = oneSec * 300,
    /** Traffic cache TTL */
    trafficDataCacheTtl = oneSec * 300,
    /** Control characters */
    controlCorrupt = /[\u0000-\u001F\u007F]/,
    /** Date key shape */
    dateKeyShape = /^\d{4}-\d{2}-\d{2}$/,
    uriCorrupt = /[:%\s\\<>"']|\.html|(^|\/)\.\.?(\/|$)/, // corrupt URI patterns
    /** Safe key charset */
    keyCorrupt = /[^A-Za-z0-9_-]/,
    /** Object-corrupting keys */
    reservedKeys: string[] = [`__proto__`, `constructor`, `prototype`],
    /** Session id limit */
    sessionMaxLength = 64,
    /** Stats id limit */
    statsIdMaxLength = 64,
    /** Referrer limit */
    referrerMaxLength = 300,
    /** Tag limit */
    tagMaxLength = 64,
    /** Window dimension limit */
    dimensionMax = 8192,
    /** Duration limit (seconds) */
    durationMax = 43200,
    /** Report days limit */
    reportDaysMax = 366,
    /** Report resolution limit */
    reportResolutionMax = 1_000,
    /** Future timestamp drift */
    timestampFutureLimit = oneMin,
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
    controlCorrupt,
    dateKeyShape,
    uriCorrupt,
    keyCorrupt,
    reservedKeys,
    sessionMaxLength,
    statsIdMaxLength,
    referrerMaxLength,
    tagMaxLength,
    dimensionMax,
    durationMax,
    reportDaysMax,
    reportResolutionMax,
    timestampFutureLimit,
    statsConfig,

    webConfig,
}