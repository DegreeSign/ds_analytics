import { IPRange } from "../types";
declare let 
/** IPs list */
ipL: import("../types").IPList, 
/** IP range */
ipRange: IPRange[];
declare const ipUpdateIntervals: ({ rangeRefreshInterval, ipLimitResetInterval, }: {
    /** default is 24 hours */
    rangeRefreshInterval?: number;
    /** default is 5 mins */
    ipLimitResetInterval?: number;
}) => void;
export { ipL as ipList, ipRange, ipUpdateIntervals, };
