import { NumberObjObj, NumberObj, DateString } from "@degreesign/utils";
import { StatsConfig, StatsReqParams, VisitorVisitsType, PageVisitPayload, StatsAnalysisResult, TrafficDataDay } from "../types/stats";
import { IPRange } from "../types/ip";
declare const recordStats: ({ ipRange, ips, data }: {
    ipRange: IPRange[];
    ips: string;
    data: PageVisitPayload;
}) => void, combineStats: (days: string[]) => TrafficDataDay, compareDateStrings: ({ startDay, endDay, }: {
    startDay: DateString;
    endDay?: DateString;
}) => string[] | undefined, compareStats: ({ startDay, endDay, }: {
    startDay: DateString;
    endDay?: DateString;
}) => (StatsAnalysisResult | undefined)[] | undefined, compare24hr: () => (StatsAnalysisResult | undefined)[] | undefined, statsPeriodStr: ({ days, endTime, }: {
    days: number;
    endTime?: number;
}) => {
    thisPeriod: string;
    prvPeriod: string;
}, statsAddOne: ({ typeName, visitsObj, visitorsObj, visitId, }: {
    typeName: string;
    visitsObj: NumberObj;
    visitorsObj: NumberObjObj;
    visitId: string;
}) => void, formatVisits: ({ visitors, visits, }: {
    visitors: NumberObjObj;
    visits: NumberObj;
}) => VisitorVisitsType[], analyseStats: ({ dayData, dateReqStr, spamVisitorLimit, spamVisitsLimit, bounceSecondsLimit, visitMinSeconds, visitCutOffSeconds, resolution, updateStartTime, calcFreqVisits, }: StatsReqParams) => StatsAnalysisResult | undefined, 
/** Config Stats */
configStats: (config: StatsConfig) => void, 
/** Start Stats */
startStats: () => void;
export { configStats, statsPeriodStr, statsAddOne, formatVisits, analyseStats, recordStats, startStats, compareDateStrings, combineStats, compare24hr, compareStats, };
