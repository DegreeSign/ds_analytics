import { seoDt } from "@degreesign/utils";
import { IPRange } from "../types/ip";
import {
    CountryCode,
    countriesCodes,
    reservedKeys,
    unknownCountryCode,
} from "./constants";

const
    /** Safe IP length */
    ipMaxLength = 45,
    /** Request IP input limit */
    ipInputMaxLength = 4e3,
    /** Request IP count limit */
    ipArrayMaxEntries = 64,
    /** IPv4-mapped prefix */
    ipMappedPrefix = `::ffff:`,
    /** IPv4 octet shape */
    ipv4OctetShape = /^\d{1,3}$/,
    /** Octet value, -1 invalid */
    ipOctetValue = (octet: string) => {
        if (!ipv4OctetShape.test(octet)) return -1;
        const value = Number(octet);
        return value > 255 ? -1 : value;
    },
    /** IP Num */
    ipNumericalValue = (ip: string) => {
        try {
            const octets = ip?.split(`.`);
            if (octets?.length !== 4) return NaN;
            let num = 0;
            for (let i = 0; i < octets.length; i++) {
                const octetValue = ipOctetValue(octets[i]);
                if (octetValue < 0) return NaN;
                num = num * 256 + octetValue;
            };
            return num;
        } catch {
            return NaN
        };
    },
    /** IP array */
    ipArray = (ips: string) => {
        const ipList: string[] = [];
        if (!ips || ips.length > ipInputMaxLength) return ipList;
        const entries = ips.split(`,`);
        for (let i = 0; i < entries.length && ipList.length < ipArrayMaxEntries; i++) {
            const ip = canonicalIP(entries[i].trim());
            if (ip) ipList.push(ip);
        };
        return ipList;
    },
    /** Mapped IPv4 octets */
    ipv4Mapped = (ip: string) => {
        if (!ip.startsWith(ipMappedPrefix)) return ``;
        const groups = ip.slice(ipMappedPrefix.length).split(`:`);
        if (groups.length != 2) return ``;
        const
            high = parseInt(groups[0], 16),
            low = parseInt(groups[1], 16);
        if (!Number.isInteger(high) || !Number.isInteger(low)) return ``;
        return [high >> 8, high & 0xFF, low >> 8, low & 0xFF].join(`.`);
    },
    /** Canonical IP key */
    canonicalIP = (ip: string) => {
        if (!ip || ip.length > ipMaxLength) return ``;
        if (reservedKeys.includes(ip)) return ``;
        if (ip.includes(`:`)) {
            try {
                const hostname = new URL(`http://[${ip}]/`).hostname;
                const canonical = hostname.slice(1, -1).toLowerCase();
                return ipv4Mapped(canonical) || canonical;
            } catch {
                return ``;
            };
        };
        const octets = ip.split(`.`);
        if (octets.length !== 4) return ``;
        const values: number[] = [];
        for (let i = 0; i < octets.length; i++) {
            const octetValue = ipOctetValue(octets[i]);
            if (octetValue < 0) return ``;
            values.push(octetValue);
        };
        return values.join(`.`);
    },
    /** Safe IP key */
    validIP = (ip: string) => canonicalIP(ip) != ``,
    /** Highest IPv4 number */
    ipNumberMax = 0xFFFFFFFF,
    /** Parsed range limit */
    ipRangesMax = 1e6,
    /** Known country codes */
    ipCountryCodes = new Set<string>(Object.keys(countriesCodes)),
    /** Valid IP range */
    validIPRange = ({ startNum, endNum, country }: { startNum: number, endNum: number, country: CountryCode }) => {
        if (!Number.isSafeInteger(startNum) || !Number.isSafeInteger(endNum)) return false;
        if (startNum < 0 || startNum > endNum || endNum > ipNumberMax) return false;
        return ipCountryCodes.has(country);
    },
    /** ranges already sorted by startNum (for binary search) */
    ipRangesSorted = new WeakSet<IPRange[]>(),
    /** sorted by startNum for ipRangeIndex */
    ipRangeSort = (ipRange: IPRange[]) => {
        let writeIndex = 0;
        for (
            let readIndex = 0;
            readIndex < ipRange.length && readIndex < ipRangesMax;
            readIndex++
        ) {
            if (writeIndex >= ipRangesMax) break;
            const range = ipRange[readIndex];
            if (!Array.isArray(range)) continue;
            if (!validIPRange({ startNum: range[0], endNum: range[1], country: range[2] })) continue;
            ipRange[writeIndex++] = range;
        };
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
            const ipSelected = ipArray(ips).find(ip => !ip.includes(`:`) && validIP(ip));
            if (ipSelected) {
                const num = ipNumericalValue(ipSelected);
                if (Number.isFinite(num)) {
                    const
                        sortedRange = ipRangesSorted.has(ipRange) ? ipRange : ipRangeSort(ipRange),
                        [, endNum, countryCode] = sortedRange[ipRangeIndex(sortedRange, num)] || [];
                    if (num <= endNum) code = countryCode;
                };
            };
        } catch (e) {
            console.log(seoDt(), `ipCountryCode failed`, e);
        };
        return code && Object.hasOwn(countriesCodes, code) ? code : unknownCountryCode
    };

export {
    ipNumericalValue,
    ipArray,
    validIP,
    ipRangesMax,
    validIPRange,
    ipRangeSort,
    ipRangeIndex,
    ipCountryCode,
}