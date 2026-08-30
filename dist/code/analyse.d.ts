import { IPRange } from "../types/ip";
import { CountryCode } from "./constants";
declare const 
/** IP Num */
ipNumericalValue: (ip: string) => number, 
/** IP array */
ipArray: (ips: string) => string[], 
/** sorted by startNum for ipRangeIndex */
ipRangeSort: (ipRange: IPRange[]) => IPRange[], 
/** greatest startNum <= num, or -1 */
ipRangeIndex: (ipRange: IPRange[], num: number) => number, ipCountryCode: ({ code, ips, ipRange, }: {
    code?: CountryCode;
    ips: string;
    ipRange: IPRange[];
}) => CountryCode;
export { ipNumericalValue, ipArray, ipRangeSort, ipRangeIndex, ipCountryCode, };
