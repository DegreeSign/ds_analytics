import { oneDay, oneMin } from "@degreesign/utils";
import { ipRangeUpdate, ipListReset } from "./manage";

let
    rangeRefresh = setInterval(ipRangeUpdate, oneDay),
    resetJob = setInterval(ipListReset, oneMin * 5);

const
    ipUpdateIntervals = ({
        rangeRefreshInterval,
        ipLimitResetInterval,
    }: {
        /** default is 24 hours */
        rangeRefreshInterval?: number;
        /** default is 5 mins */
        ipLimitResetInterval?: number;
    }) => {
        if (typeof rangeRefreshInterval == `number`) {
            clearInterval(rangeRefresh);
            rangeRefresh = setInterval(ipRangeUpdate, rangeRefreshInterval);
        };
        if (typeof ipLimitResetInterval == `number`) {
            clearInterval(resetJob);
            resetJob = setInterval(ipListReset, ipLimitResetInterval);
        };
    };

export {
    ipUpdateIntervals
}