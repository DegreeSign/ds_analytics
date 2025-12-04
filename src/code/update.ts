import { seoDt, oneDay, oneMin } from "@degreesign/utils";
import { redJ, wrtJ } from "@degreesign/cache";
import { ipResetLimits } from "./manage";
import { IPData } from "../types";
import { ipCountryDataUpdate } from "./range";

const
    ipData: IPData = {
        ipList: ipResetLimits(),
        ipRange: redJ(`ip_range.json`) || [],
    },
    ipRangeUpdate = async () => {
        try {
            const ranges = await ipCountryDataUpdate();
            if (ranges?.length) {
                ipData.ipRange = ranges;
                wrtJ(`ip_range.json`, ranges);
            };
        } catch (e) { console.log(seoDt(), `ipRangeUpdate failed`, e); };
    },
    ipListReset = () => {
        ipData.ipList = ipResetLimits()
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