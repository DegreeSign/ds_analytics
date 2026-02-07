import { oneDay, oneMin, seoDt } from "@degreesign/utils";
import { ipRangeUpdate, ipListReset, ipData } from "./manage";
import { IPConfig } from "../types/ip";
import { redJ } from "@degreesign/cache";

let
    ipRangeRefresh = setInterval(() => { }, oneDay),
    ipLimitResetJob = setInterval(() => { }, oneDay);

clearInterval(ipRangeRefresh);
clearInterval(ipLimitResetJob);

const
    ipStart = async ({
        ipRangeRefreshInterval = oneDay,
        ipLimitResetInterval = oneMin * 5,
    }: IPConfig) => {
        try {
            ipData.ipRange = redJ(`ip_range.json`, true) || [];

            // fetch ip range
            if (!ipData.ipRange?.length)
                await ipRangeUpdate();

            // update refresh intervals
            if (typeof ipRangeRefreshInterval == `number`) {
                if (ipRangeRefresh) clearInterval(ipRangeRefresh);
                ipRangeRefresh = setInterval(ipRangeUpdate, ipRangeRefreshInterval);
            };

            // reset ip limits
            if (typeof ipLimitResetInterval == `number`) {
                if (ipLimitResetJob) clearInterval(ipLimitResetJob);
                ipLimitResetJob = setInterval(ipListReset, ipLimitResetInterval);
            };
        } catch (e) {
            console.log(seoDt(), `ipStart failed`, e);
        };
    };

export {
    ipStart,
};