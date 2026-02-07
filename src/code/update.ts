import { oneDay, oneMin } from "@degreesign/utils";
import { ipRangeUpdate, ipListReset, ipData } from "./manage";
import { IPConfig } from "../types/ip";

let
    ipRangeRefresh = setInterval(() => { }, oneDay),
    ipLimitResetJob = setInterval(() => { }, oneDay);

const
    ipStart = async ({
        ipRangeRefreshInterval = oneDay,
        ipLimitResetInterval = oneMin * 5,
    }: IPConfig) => {

        // fetch ip range
        if (!ipData.ipRange?.length)
            await ipRangeUpdate();

        // update refresh intervals
        if (typeof ipRangeRefreshInterval == `number`) {
            clearInterval(ipRangeRefresh);
            ipRangeRefresh = setInterval(ipRangeUpdate, ipRangeRefreshInterval);
        };

        // reset ip limits
        if (typeof ipLimitResetInterval == `number`) {
            clearInterval(ipLimitResetJob);
            ipLimitResetJob = setInterval(ipListReset, ipLimitResetInterval);
        };
    };

export {
    ipStart,
};