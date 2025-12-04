import { IPList, IPData } from "../types";
declare const 
/** IP object reset */
ipResetLimits: () => IPList, 
/** IP spam check */
ipCheck: (ips: string) => 0 | 1 | undefined, 
/** IP add to whitelist */
ipWhiteList: (ips: string) => void, 
/** IP add to priority list */
ipPriorityList: (ips: string) => void, ipData: IPData, ipRangeUpdate: () => Promise<void>, ipListReset: () => void;
export { ipResetLimits, ipCheck, ipWhiteList, ipPriorityList, ipData, ipRangeUpdate, ipListReset, };
