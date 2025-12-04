import { IPList, RateLimits } from "../types";
declare const 
/** IP object reset */
ipReset: () => IPList, 
/** IP spam check */
chkIp: (ips: string, ipL: IPList, limits?: RateLimits) => 0 | 1 | undefined, 
/** IP add to whitelist */
wIP: (ips: string, ipL: IPList) => void, 
/** IP add to priority list */
pIP: (ips: string, ipL: IPList) => void;
export { ipReset, chkIp, wIP, pIP, };
