import { oneDay, oneMin } from "@degreesign/utils";
import { ipRangeUpdate, ipListReset, ipData } from "./manage";

let
    ipRangeRefresh = setInterval(() => { }, oneDay),
    ipLimitResetJob = setInterval(() => { }, oneDay);

const
    ipStart = async ({
        ipRangeRefreshInterval = oneDay,
        ipLimitResetInterval = oneMin * 5,
    }: {
        /** default is 24 hours */
        ipRangeRefreshInterval?: number;
        /** default is 5 mins */
        ipLimitResetInterval?: number;
    }) => {

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