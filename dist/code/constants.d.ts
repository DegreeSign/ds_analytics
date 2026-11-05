import { countriesCodes } from "./countries";
import { CountryCode } from "../types/country";
import { RateLimits } from "../types/ip";
import { StatsConfig } from "../types/stats";
import { WebConfig } from "../types/web";
declare const 
/** IP range source */
ipSourceUrl: string, 
/** Unknown country code */
unknownCountryCode: CountryCode, 
/** IP rate limits */
ipRateLimits: RateLimits, checkInterval = 5000, checkIntervalMax: number, 
/** Traffic cache TTL */
trafficDataCacheTtl: number, 
/** Control characters */
controlCorrupt: RegExp, 
/** Date key shape */
dateKeyShape: RegExp, uriCorrupt: RegExp, // corrupt URI patterns
/** Safe key charset */
keyCorrupt: RegExp, 
/** Object-corrupting keys */
reservedKeys: string[], 
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
reportResolutionMax = 1000, 
/** Future timestamp drift */
timestampFutureLimit = 60000, statsConfig: StatsConfig, webConfig: WebConfig;
export { ipSourceUrl, unknownCountryCode, CountryCode, countriesCodes, ipRateLimits, checkInterval, checkIntervalMax, trafficDataCacheTtl, controlCorrupt, dateKeyShape, uriCorrupt, keyCorrupt, reservedKeys, sessionMaxLength, statsIdMaxLength, referrerMaxLength, tagMaxLength, dimensionMax, durationMax, reportDaysMax, reportResolutionMax, timestampFutureLimit, statsConfig, webConfig, };
