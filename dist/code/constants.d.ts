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
ipRateLimits: RateLimits, checkInterval = 5000, 
/** Traffic cache TTL for eviction (5 minutes) */
trafficDataCacheTtl: number, uriCorrupt: RegExp, // checks for : % space or .html
statsConfig: StatsConfig, webConfig: WebConfig;
export { ipSourceUrl, unknownCountryCode, CountryCode, countriesCodes, ipRateLimits, checkInterval, trafficDataCacheTtl, uriCorrupt, statsConfig, webConfig, };
