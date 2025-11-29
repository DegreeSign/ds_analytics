import { IPList, IPRange, RateLimits } from "./types";
declare const rateLimits: RateLimits, chkIp: (ips: string, ipL: IPList, limits?: RateLimits) => 1 | 0 | undefined, wIP: (ips: string, ipL: IPList) => void, 
/** add to priority list */
pIP: (ips: string, ipL: IPList) => void, 
/** IP Num */
ipNum: (ip: string) => number, 
/** IP array */
ipAr: (ips: string) => string[], 
/** IP object reset */
ipReset: () => {
    /**  ip pro list + counter */
    p: {};
    /**  ip cloud white list + counter */
    w: {};
    /**  ip black list */
    b: never[];
    /**  ip general list + counter */
    l: {};
}, updateIPData: () => Promise<IPRange[]>, ipCountryCode: ({ code, ips, ipRange, }: {
    code?: string;
    ips: string;
    ipRange: IPRange[];
}) => string;
export { chkIp, wIP, pIP, ipNum, ipAr, ipReset, rateLimits, updateIPData, ipCountryCode, };
