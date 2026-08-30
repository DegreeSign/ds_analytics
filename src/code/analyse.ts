import { seoDt } from "@degreesign/utils";
import { IPRange } from "../types/ip";
import { CountryCode, countriesCodes, unknownCountryCode } from "./constants";

const
    /** IP Num */
    ipNumericalValue = (ip: string) => {
        try {
            return ip?.split('.')?.reduce((acc, octet) => acc * 256 + parseInt(octet), 0);
        } catch {
            return 0
        };
    },
    /** IP array */
    ipArray = (ips: string) => ips ?
        ips.match(`, `) ? ips.split(`, `)
            : ips.match(`::ffff:`) ? ips.split(`::ffff:`)
                : []
        : [],
    /** ranges already sorted by startNum (for binary search) */
    ipRangesSorted = new WeakSet<IPRange[]>(),
    /** sorted by startNum for ipRangeIndex */
    ipRangeSort = (ipRange: IPRange[]) => {
        let writeIndex = 0;
        for (let readIndex = 0; readIndex < ipRange.length; readIndex++)
            if (Array.isArray(ipRange[readIndex])) ipRange[writeIndex++] = ipRange[readIndex];
        ipRange.length = writeIndex;
        ipRange.sort(([startNumA], [startNumB]) => startNumA - startNumB);
        ipRangesSorted.add(ipRange);
        return ipRange
    },
    /** greatest startNum <= num, or -1 */
    ipRangeIndex = (ipRange: IPRange[], num: number) => {
        let
            low = 0,
            high = ipRange.length - 1,
            found = -1;
        while (low <= high) {
            const middle = (low + high) >> 1;
            if (ipRange[middle]?.[0] <= num) { found = middle; low = middle + 1; }
            else high = middle - 1;
        };
        return found
    },
    ipCountryCode = ({
        code,
        ips,
        ipRange,
    }: {
        code?: CountryCode,
        ips: string,
        ipRange: IPRange[],
    }): CountryCode => {
        try {
            const ipSelected = ipArray(ips)?.find(ip => !ip?.includes(`:`));
            if (ipSelected) {
                const
                    num = ipNumericalValue(ipSelected),
                    sortedRange = ipRangesSorted.has(ipRange) ? ipRange : ipRangeSort(ipRange),
                    [, endNum, countryCode] = sortedRange[ipRangeIndex(sortedRange, num)] || [];
                if (num <= endNum) code = countryCode;
            };
        } catch (e) {
            console.log(seoDt(), `ipCountryCode failed`, e);
        };
        return code && countriesCodes[code] ? code : unknownCountryCode
    };

export {
    ipNumericalValue,
    ipArray,
    ipRangeSort,
    ipRangeIndex,
    ipCountryCode,
}