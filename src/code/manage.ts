import { NumberObj, oneHr, seoDt } from "@degreesign/utils";
import { IPList, IPData } from "../types/ip";
import { ipArray, validIP } from "./analyse";
import { ipRateLimits } from "./constants";
import { ipCountryDataUpdate } from "./range";
import { writeJsonAtomic } from "./storage";

const
    /** Blacklist TTL (1 hour) */
    ipBlackListTtl = oneHr,
    /** Blacklist expiry */
    ipBlackListExpiry = new Map<string, number>(),
    /** Counter entry counts */
    ipCounterSizes = new WeakMap<NumberObj, number>(),
    /** List entry limit */
    ipListMaxEntries = 1e4,
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
    /** Increment one counter */
    ipCounterAdd = ({ counters, ip }: { counters: NumberObj, ip: string }) => {
        if (Object.hasOwn(counters, ip)) { counters[ip] += 1; return; };
        const size = ipCounterSizes.get(counters) ?? 0;
        if (size >= ipListMaxEntries) return;
        counters[ip] = 1;
        ipCounterSizes.set(counters, size + 1);
    },
    /** IP spam check */
    ipCheck = (ips: string) => {
        try {
            const
                ipL = ipData.ipList,
                now = Date.now(),
                generalList = ipRateLimits.generalAccess, // general visitor
                whiteList = ipRateLimits.whiteListed, // white list
                priorityList = ipRateLimits.priorityAccess; // priority list

            // check array against limits
            const ipA = ipArray(ips);
            if (!ipA.length) return ips?.trim() ? 0 : 1;
            for (let i = 0; i < ipA.length; i++) {
                const u = ipA[i]; // check each ip
                if (u && validIP(u)) {
                    if (ipL.p[u] < priorityList || ipL.w[u] < whiteList) { break; } // cloud list
                    const expiry = ipBlackListExpiry.get(u);
                    if (expiry && expiry > now) { return 0; } // black list
                    if (expiry) { // expired black entry
                        ipBlackListExpiry.delete(u);
                        const blackIndex = ipL.b.indexOf(u);
                        if (blackIndex > -1) ipL.b.splice(blackIndex, 1);
                        ipL.l[u] = 0; // fresh counter window
                    };
                    if (ipL.l[u]) {
                        if (ipL.l[u] > generalList) {
                            if (ipL.b.length < ipListMaxEntries) {
                                ipL.b.push(u);
                                ipBlackListExpiry.set(u, now + ipBlackListTtl);
                            };
                            return 0; // add to black list
                        } else { ipCounterAdd({ counters: ipL.l, ip: u }); }; // general list ++
                    } else { ipCounterAdd({ counters: ipL.l, ip: u }); }; // add to general list
                };
            };
            return 1;
        } catch (e) { console.log(seoDt(), `Validating IP failed`, e); return 0; };
    },
    /** IP add to whitelist */
    ipWhiteList = (ips: string) => {
        try {
            const
                ipL = ipData.ipList,
                list = ipArray(ips);
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                if (u && validIP(u)) ipCounterAdd({ counters: ipL.w, ip: u });
            };
        } catch (e) { console.log(seoDt(), `Checking IP whitelist failed`, e); };
    },
    /** IP add to priority list */
    ipPriorityList = (ips: string) => {
        try {
            const
                ipL = ipData.ipList,
                list = ipArray(ips);
            for (let i = 0; i < list.length; i++) {
                const u = list[i];
                if (u && validIP(u)) ipCounterAdd({ counters: ipL.p, ip: u });
            };
        } catch (e) { console.log(seoDt(), `Checking IP priority list failed`, e); };
    },
    ipData: IPData = {
        ipList: ipResetLimits(),
        ipRange: [],
    },
    ipRangeUpdate = async () => {
        try {
            const ranges = await ipCountryDataUpdate();
            if (ranges?.length) {
                ipData.ipRange = ranges;
                if (!writeJsonAtomic({ filePath: `ip_range.json`, data: ranges }))
                    console.log(seoDt(), `ipRangeUpdate cache write failed`);
            };
        } catch (e) { console.log(seoDt(), `ipRangeUpdate failed`, e); };
    },
    ipListReset = () => {
        const
            now = Date.now(),
            previous = ipData.ipList.b,
            retained: string[] = [];
        for (let i = 0; i < previous.length; i++) {
            const
                ip = previous[i],
                expiry = ipBlackListExpiry.get(ip) ?? now + ipBlackListTtl;
            if (expiry > now && retained.length < ipListMaxEntries) {
                ipBlackListExpiry.set(ip, expiry);
                retained.push(ip);
            } else {
                ipBlackListExpiry.delete(ip);
            };
        };
        ipData.ipList = ipResetLimits();
        ipData.ipList.b = retained;
    };

export {
    ipResetLimits,
    ipCheck,
    ipWhiteList,
    ipPriorityList,
    ipData,
    ipRangeUpdate,
    ipListReset,
}