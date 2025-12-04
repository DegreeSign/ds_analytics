import { seoDt, oneDay, oneMin } from "@degreesign/utils";
import { redJ, wrtJ } from "@degreesign/cache";
import { ipReset } from "./manage";
import { IPRange } from "../types";
import { updateIPData } from "./range";

let
    /** IPs list */
    ipL = ipReset(),
    /** IP range */
    ipRange: IPRange[] = redJ(`ip_range.json`) || [];

const
    ipRangeUpdate = async () => {
        try {
            const ranges = await updateIPData();
            if (ranges?.length) {
                ipRange = ranges;
                wrtJ(`ip_range.json`, ranges);
            };
        } catch (e) { console.log(seoDt(), `ipRangeUpdate failed`, e); };
    },
    ipListReset = () => {
        ipL = ipReset()
    };

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
    ipL as ipList,
    ipRange,
    ipUpdateIntervals,
}