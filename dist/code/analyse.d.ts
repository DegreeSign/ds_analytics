import { IPRange } from "../types";
declare const 
/** IP Num */
ipNum: (ip: string) => number, 
/** IP array */
ipAr: (ips: string) => string[], ipCountryCode: ({ code, ips, ipRange, }: {
    code?: string;
    ips: string;
    ipRange: IPRange[];
}) => string;
export { ipNum, ipAr, ipCountryCode, };
