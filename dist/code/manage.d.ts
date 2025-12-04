import { IPList } from "../types";
declare const 
/** IP object reset */
ipResetLimits: () => IPList, 
/** IP spam check */
ipCheck: (ips: string) => 0 | 1 | undefined, 
/** IP add to whitelist */
ipWhiteList: (ips: string) => void, 
/** IP add to priority list */
ipPaidList: (ips: string) => void;
export { ipResetLimits, ipCheck, ipWhiteList, ipPaidList, };
