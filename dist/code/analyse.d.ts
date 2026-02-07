import { IPRange } from "../types/ip";
import { CountryCode } from "./constants";
declare const 
/** IP Num */
ipNumericalValue: (ip: string) => number, 
/** IP array */
ipArray: (ips: string) => string[], ipCountryCode: ({ code, ips, ipRange, }: {
    code?: CountryCode;
    ips: string;
    ipRange: IPRange[];
}) => CountryCode;
export { ipNumericalValue, ipArray, ipCountryCode, };
