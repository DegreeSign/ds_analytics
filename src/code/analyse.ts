import { IPRange } from "../types";
import { countriesCodes } from "./constants";

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
        code?: string,
        ips: string,
        ipRange: IPRange[],
    }): string => {
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
        } catch (error) {
            console.error(`ipCountryCode failed`, error);
        };
        return code && countriesCodes[code] ? code : `UN`
    };

export {
    ipNumericalValue,
    ipArray,
    ipCountryCode,
}