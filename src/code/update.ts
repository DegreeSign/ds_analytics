import { oneDay, oneMin, seoDt } from "@degreesign/utils";
import { ipRangeUpdate, ipListReset, ipData } from "./manage";
import { ipRangeSort } from "./analyse";
import { clampNumber } from "./validation";
import { IPConfig, IPRange } from "../types/ip";
import { redJ } from "@degreesign/cache";

let
    ipRangeRefresh = setInterval(() => { }, oneDay),
    ipLimitResetJob = setInterval(() => { }, oneDay);

clearInterval(ipRangeRefresh);
clearInterval(ipLimitResetJob);

const
    /** Refresh interval min */
    ipRangeRefreshMin = oneMin * 5,
    /** Refresh interval max */
    ipRangeRefreshMax = oneDay * 7,
    /** Reset interval min */
    ipLimitResetMin = oneMin,
    /** Reset interval max */
    ipLimitResetMax = oneDay,
    ipStart = async ({
        ipRangeRefreshInterval = oneDay,
        ipLimitResetInterval = oneMin * 5,
    }: IPConfig) => {
        try {
            const cachedRanges = redJ<IPRange[]>(`ip_range.json`, true);
            ipData.ipRange = ipRangeSort(Array.isArray(cachedRanges) ? cachedRanges : []);

            // fetch ip range
            if (!ipData.ipRange?.length)
                await ipRangeUpdate();

            // update refresh intervals
            if (Number.isFinite(ipRangeRefreshInterval)) {
                if (ipRangeRefresh) clearInterval(ipRangeRefresh);
                ipRangeRefresh = setInterval(ipRangeUpdate, clampNumber({
                    value: ipRangeRefreshInterval,
                    minimum: ipRangeRefreshMin,
                    maximum: ipRangeRefreshMax,
                }));
            };

            // reset ip limits
            if (Number.isFinite(ipLimitResetInterval)) {
                if (ipLimitResetJob) clearInterval(ipLimitResetJob);
                ipLimitResetJob = setInterval(ipListReset, clampNumber({
                    value: ipLimitResetInterval,
                    minimum: ipLimitResetMin,
                    maximum: ipLimitResetMax,
                }));
            };
        } catch (e) {
            console.log(seoDt(), `ipStart failed`, e);
        };
    };

export {
    ipStart,
};