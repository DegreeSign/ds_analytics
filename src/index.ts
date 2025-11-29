import axios from "axios";
import csvParser from "csv-parser";
import { Stream } from "stream";
import { IPCountryRow, IPList, IPRange, RateLimits } from "./types";
import { NumberObj, tN } from "@degreesign/utils";

const
    countriesCodes: NumberObj = { "AD": 1, "AE": 1, "AF": 1, "AG": 1, "AI": 1, "AL": 1, "AM": 1, "AO": 1, "AQ": 1, "AR": 1, "AS": 1, "AT": 1, "AU": 1, "AW": 1, "AX": 1, "AZ": 1, "BA": 1, "BB": 1, "BD": 1, "BE": 1, "BF": 1, "BG": 1, "BH": 1, "BI": 1, "BJ": 1, "BL": 1, "BM": 1, "BN": 1, "BO": 1, "BQ": 1, "BR": 1, "BS": 1, "BT": 1, "BV": 1, "BW": 1, "BY": 1, "BZ": 1, "CA": 1, "CC": 1, "CD": 1, "CF": 1, "CG": 1, "CH": 1, "CI": 1, "CK": 1, "CL": 1, "CM": 1, "CN": 1, "CO": 1, "CR": 1, "CU": 1, "CV": 1, "CW": 1, "CX": 1, "CY": 1, "CZ": 1, "DE": 1, "DJ": 1, "DK": 1, "DM": 1, "DO": 1, "DZ": 1, "EC": 1, "EE": 1, "EG": 1, "EH": 1, "ER": 1, "ES": 1, "ET": 1, "FI": 1, "FJ": 1, "FK": 1, "FM": 1, "FO": 1, "FR": 1, "GA": 1, "GB": 1, "GD": 1, "GE": 1, "GF": 1, "GG": 1, "GH": 1, "GI": 1, "GL": 1, "GM": 1, "GN": 1, "GP": 1, "GQ": 1, "GR": 1, "GS": 1, "GT": 1, "GU": 1, "GW": 1, "GY": 1, "HK": 1, "HM": 1, "HN": 1, "HR": 1, "HT": 1, "HU": 1, "ID": 1, "IE": 1, "IL": 1, "IM": 1, "IN": 1, "IO": 1, "IQ": 1, "IR": 1, "IS": 1, "IT": 1, "JE": 1, "JM": 1, "JO": 1, "JP": 1, "KE": 1, "KG": 1, "KH": 1, "KI": 1, "KM": 1, "KN": 1, "KP": 1, "KR": 1, "KW": 1, "KY": 1, "KZ": 1, "LA": 1, "LB": 1, "LC": 1, "LI": 1, "LK": 1, "LR": 1, "LS": 1, "LT": 1, "LU": 1, "LV": 1, "LY": 1, "MA": 1, "MC": 1, "MD": 1, "ME": 1, "MF": 1, "MG": 1, "MH": 1, "MK": 1, "ML": 1, "MM": 1, "MN": 1, "MO": 1, "MP": 1, "MQ": 1, "MR": 1, "MS": 1, "MT": 1, "MU": 1, "MV": 1, "MW": 1, "MX": 1, "MY": 1, "MZ": 1, "NA": 1, "NC": 1, "NE": 1, "NF": 1, "NG": 1, "NI": 1, "NL": 1, "NO": 1, "NP": 1, "NR": 1, "NU": 1, "NZ": 1, "OM": 1, "PA": 1, "PE": 1, "PF": 1, "PG": 1, "PH": 1, "PK": 1, "PL": 1, "PM": 1, "PN": 1, "PR": 1, "PS": 1, "PT": 1, "PW": 1, "PY": 1, "QA": 1, "RE": 1, "RO": 1, "RS": 1, "RU": 1, "RW": 1, "SA": 1, "SB": 1, "SC": 1, "SD": 1, "SE": 1, "SG": 1, "SH": 1, "SI": 1, "SJ": 1, "SK": 1, "SL": 1, "SM": 1, "SN": 1, "SO": 1, "SR": 1, "SS": 1, "ST": 1, "SV": 1, "SX": 1, "SY": 1, "SZ": 1, "TC": 1, "TD": 1, "TF": 1, "TG": 1, "TH": 1, "TJ": 1, "TK": 1, "TL": 1, "TM": 1, "TN": 1, "TO": 1, "TR": 1, "TT": 1, "TV": 1, "TW": 1, "TZ": 1, "UA": 1, "UG": 1, "UM": 1, "US": 1, "UY": 1, "UZ": 1, "VA": 1, "VC": 1, "VE": 1, "VG": 1, "VI": 1, "VN": 1, "VU": 1, "WF": 1, "WS": 1, "XK": 1, "YE": 1, "YT": 1, "ZA": 1, "ZM": 1, "ZW": 1, "UN": 1 },
    // IP 
    rateLimits: RateLimits = {
        general: 20,
        white: 100,
        paid: 500,
    },
    // Spam check
    chkIp = (ips: string, ipL: IPList, limits: RateLimits = rateLimits) => {
        try {
            const
                generalList = limits.general, // general user
                whiteList = limits.white, // white list
                paidList = limits.paid; // paid list

            // check array against limits
            const ipA = ipAr(ips);
            for (let i = 0; i < ipA.length; i++) {
                const u = ipA[i]; // check each ip
                if (u) {
                    if (ipL.p[u] < paidList || ipL.w[u] < whiteList) { break; } // cloud list
                    else if (ipL.b.indexOf(u) > -1) { return 0; } // black list
                    else if (ipL.l[u]) {
                        if (ipL.l[u] > generalList) {
                            ipL.b.push(u); return 0; // add to black list
                        } else { ipL.l[u] += 1; }; // general list ++
                    } else { ipL.l[u] = 1; }; // add to general list
                };
            };
            return 1;
        } catch (e) { console.log(tN(), `Validating IP failed`, e); };
    },
    // add to whitelist
    wIP = (ips: string, ipL: IPList) => {
        try {
            const list = ipAr(ips);
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                u ? ipL.w[u] ? ipL.w[u] += 1 : ipL.w[u] = 1 : 0
            };
        } catch (e) { console.log(tN(), `Checking IP whitelist failed`, e); };
    },
    /** add to priority list */
    pIP = (ips: string, ipL: IPList) => {
        try {
            const list = ipAr(ips);
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                u ? ipL.p[u] ? ipL.p[u] += 1 : ipL.p[u] = 1 : 0
            };
        } catch (e) { console.log(tN(), `Checking IP priority list failed`, e); };
    },
    /** IP Num */
    ipNum = (ip: string) => {
        try {
            return ip?.split('.')?.reduce((acc, octet) => acc * 256 + parseInt(octet), 0);
        } catch {
            return 0
        };
    },
    /** IP array */
    ipAr = (ips: string) => ips ?
        ips.match(`, `) ? ips.split(`, `)
            : ips.match(`::ffff:`) ? ips.split(`::ffff:`)
                : []
        : [],

    /** IP object reset */
    ipReset = () => {
        return { // ip lists
            /**  ip pro list + counter */
            p: {},
            /**  ip cloud white list + counter */
            w: {},
            /**  ip black list */
            b: [],
            /**  ip general list + counter */
            l: {},
        }
    },
    ipSourceUrl: string = "https://cdn.jsdelivr.net/npm/@ip-location-db/dbip-country/dbip-country-ipv4-num.csv",
    updateIPData = async (): Promise<IPRange[]> => await new Promise(async resolve => {
        try {
            const
                response = await axios.get<NodeJS.ReadableStream>(ipSourceUrl, { responseType: "stream" }),
                data: Stream = response.data.pipe(csvParser({
                    headers: ['start_ip_num', 'end_ip_num', 'country'],
                    skipLines: 0
                })),
                ipRanges: IPRange[] = [];

            data
                .on("data", (row: IPCountryRow) => {
                    const
                        startNum: number = parseInt(row.start_ip_num),
                        endNum: number = parseInt(row.end_ip_num),
                        country: string = row.country;
                    if (startNum && country) {
                        ipRanges.push([startNum, endNum, country]);
                    }
                })
                .on("end", () => {
                    if (!ipRanges?.length)
                        console.log(`updateIPData no data`);
                    else resolve(ipRanges)
                })
                .on("error", (error: Error) => {
                    console.log(`updateIPData error`, error);
                });
        } catch (e) {
            console.log(`updateIPData failed`, e);
            return resolve([])
        };
    }),
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
            const ipSelected = ipAr(ips)?.find(ip => !ip?.includes(`:`));
            if (ipSelected) {
                const num = ipNum(ipSelected)
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
    chkIp as ipCheck,
    wIP as ipWhiteList,
    pIP as ipPaidList,
    ipNum as ipNumericalValue,
    ipAr as ipArray,
    ipReset as ipResetLimits,
    rateLimits as ipRateLimits,
    updateIPData as ipCountryDataUpdate,
    ipCountryCode,
}