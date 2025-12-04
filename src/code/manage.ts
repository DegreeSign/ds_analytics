import { seoDt } from "@degreesign/utils";
import { IPList, RateLimits } from "../types";
import { ipAr } from "./analyse";
import { rateLimits } from "./constants";

const
    /** IP object reset */
    ipReset = (): IPList => {
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
        } catch (e) { console.log(seoDt(), `Validating IP failed`, e); };
    },
    /** IP add to whitelist */
    wIP = (ips: string, ipL: IPList) => {
        try {
            const list = ipAr(ips);
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                u ? ipL.w[u] ? ipL.w[u] += 1 : ipL.w[u] = 1 : 0
            };
        } catch (e) { console.log(seoDt(), `Checking IP whitelist failed`, e); };
    },
    /** IP add to priority list */
    pIP = (ips: string, ipL: IPList) => {
        try {
            const list = ipAr(ips);
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                u ? ipL.p[u] ? ipL.p[u] += 1 : ipL.p[u] = 1 : 0
            };
        } catch (e) { console.log(seoDt(), `Checking IP priority list failed`, e); };
    };

export {
    ipReset,
    chkIp,
    wIP,
    pIP,
}