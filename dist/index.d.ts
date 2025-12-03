import { IPCountryRow, IPList, IPRange, RateLimits } from "./types";
declare const rateLimits: RateLimits, chkIp: (ips: string, ipL: IPList, limits?: RateLimits) => 1 | 0 | undefined, wIP: (ips: string, ipL: IPList) => void, 
/** add to priority list */
pIP: (ips: string, ipL: IPList) => void, 
/** IP Num */
ipNum: (ip: string) => number, 
/** IP array */
ipAr: (ips: string) => string[], 
/** IP object reset */
ipReset: () => IPList, updateIPData: () => Promise<IPRange[]>, ipCountryCode: ({ code, ips, ipRange, }: {
    code?: string;
    ips: string;
    ipRange: IPRange[];
}) => string;
export { chkIp as ipCheck, wIP as ipWhiteList, pIP as ipPaidList, ipNum as ipNumericalValue, ipAr as ipArray, ipReset as ipResetLimits, rateLimits as ipRateLimits, updateIPData as ipCountryDataUpdate, ipCountryCode, IPList, RateLimits, IPCountryRow, IPRange, };
