import { seoDt } from "@degreesign/utils";
import { IPRange } from "../types/ip";
import { CountryCode, countriesCodes } from "./constants";

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
                const num = ipNumericalValue(ipSelected)
                for (const [startNum, endNum, countryCode] of ipRange)
                    if (num >= startNum && num <= endNum) {
                        code = countryCode;
                        break;
                    };
            };
        } catch (e) {
            console.log(seoDt(), `ipCountryCode failed`, e);
        };
        return code && countriesCodes[code] ? code : `UN`
    };

export {
    ipNumericalValue,
    ipArray,
    ipCountryCode,
}