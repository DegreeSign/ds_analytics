import { seoDt, oneDay, oneMin } from "@degreesign/utils";
import { redJ, wrtJ } from "@degreesign/cache";
import { ipReset } from "./manage";
import { IPData } from "../types";
import { updateIPData } from "./range";

const
    ipData: IPData = {
        ipList: ipReset(),
        ipRange: redJ(`ip_range.json`) || [],
    },
    ipRangeUpdate = async () => {
        try {
            const ranges = await updateIPData();
            if (ranges?.length) {
                ipData.ipRange = ranges;
                wrtJ(`ip_range.json`, ranges);
            };
        } catch (e) { console.log(seoDt(), `ipRangeUpdate failed`, e); };
    },
    ipListReset = () => {
        ipData.ipList = ipReset()
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
    ipData,
    ipUpdateIntervals,
}