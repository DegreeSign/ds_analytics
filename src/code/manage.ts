import { seoDt } from "@degreesign/utils";
import { IPList } from "../types";
import { ipArray } from "./analyse";
import { ipRateLimits } from "./constants";
import { ipData } from "./update";

const
    /** IP object reset */
    ipResetLimits = (): IPList => {
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
    /** IP spam check */
    ipCheck = (ips: string) => {
        try {
            const
                ipL = ipData.ipList,
                generalList = ipRateLimits.generalAccess, // general user
                whiteList = ipRateLimits.whiteListed, // white list
                paidList = ipRateLimits.priorityAccess; // paid list

            // check array against limits
            const ipA = ipArray(ips);
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
        } catch (e) { console.log(seoDt(), `Validating IP failed`, e); };
    },
    /** IP add to whitelist */
    ipWhiteList = (ips: string) => {
        try {
            const
                ipL = ipData.ipList,
                list = ipArray(ips);
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                u ? ipL.w[u] ? ipL.w[u] += 1 : ipL.w[u] = 1 : 0
            };
        } catch (e) { console.log(seoDt(), `Checking IP whitelist failed`, e); };
    },
    /** IP add to priority list */
    ipPaidList = (ips: string) => {
        try {
            const
                ipL = ipData.ipList,
                list = ipArray(ips);
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                u ? ipL.p[u] ? ipL.p[u] += 1 : ipL.p[u] = 1 : 0
            };
        } catch (e) { console.log(seoDt(), `Checking IP priority list failed`, e); };
    };

export {
    ipResetLimits,
    ipCheck,
    ipWhiteList,
    ipPaidList,
}