import { IPRange } from "../types";
declare const 
/** IP Num */
ipNumericalValue: (ip: string) => number, 
/** IP array */
ipArray: (ips: string) => string[], ipCountryCode: ({ code, ips, ipRange, }: {
    code?: string;
    ips: string;
    ipRange: IPRange[];
}) => string;
export { ipNumericalValue, ipArray, ipCountryCode, };
