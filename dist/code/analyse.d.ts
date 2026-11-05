import { IPRange } from "../types/ip";
import { CountryCode } from "./constants";
declare const 
/** IP Num */
ipNumericalValue: (ip: string) => number, 
/** IP array */
ipArray: (ips: string) => string[], 
/** Safe IP key */
validIP: (ip: string) => boolean, 
/** Parsed range limit */
ipRangesMax = 1000000, 
/** Valid IP range */
validIPRange: ({ startNum, endNum, country }: {
    startNum: number;
    endNum: number;
    country: CountryCode;
}) => boolean, 
/** sorted by startNum for ipRangeIndex */
ipRangeSort: (ipRange: IPRange[]) => IPRange[], 
/** greatest startNum <= num, or -1 */
ipRangeIndex: (ipRange: IPRange[], num: number) => number, ipCountryCode: ({ code, ips, ipRange, }: {
    code?: CountryCode;
    ips: string;
    ipRange: IPRange[];
}) => CountryCode;
export { ipNumericalValue, ipArray, validIP, ipRangesMax, validIPRange, ipRangeSort, ipRangeIndex, ipCountryCode, };
