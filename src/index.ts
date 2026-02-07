import { dateStandard } from "@degreesign/utils";
import { ipNumericalValue, ipArray, ipCountryCode } from "./code/analyse";
import { CountryCode, RateLimits, StatsConfig, ipRateLimits } from "./code/constants";
import { ipCheck, ipWhiteList, ipPriorityList, ipResetLimits, ipData, ipRangeUpdate } from "./code/manage";
import { configStats, statsPeriodStr, statsAddOne, formatVisits, analyseStats, recordStats, startStats, compareDateStrings, combineStats, compare24hr, compareStats } from "./code/stats";
import { ipStart } from "./code/update";
import { IPCountryRange, IPData, IPList, IPRange } from "./types/ip";
import { PageVisitInitiation, PageVisitRecord, StatsFreqVisitors, StatsFreqVisits, PageVisitPayload, TrafficData, TrafficDataDay, PageTrafficData, PageTrafficDataObj, PageTrafficDataFinal, PageTrafficDataObjFinal, VisitorVisitsType, StatsAnalysisResult, StatsReqParams, StatsDeviceType, StatsDeviceObj, StatsPublicChange, StatsDevice, PageDeviceDimensions, DeviceWidthHeight } from "./types/stats";
import { startAnalyticsServer } from "./code/start";
import { ServiceConfig } from "./types/general";
import { setWebConfig, webAnalytics } from "./code/web";
import { WebConfig } from "./types/web";

export {
    // ip
    ipCheck,
    ipWhiteList,
    ipPriorityList,
    ipNumericalValue,
    ipArray,
    ipResetLimits,
    ipRateLimits,
    ipRangeUpdate,
    ipCountryCode,
    IPList,
    RateLimits,
    IPCountryRange,
    IPRange,
    ipData,
    IPData,
    ipStart,

    // stats
    statsPeriodStr,
    statsAddOne,
    formatVisits,
    analyseStats,
    recordStats,
    startStats,
    compareDateStrings,
    combineStats,
    compare24hr,
    compareStats,
    PageVisitInitiation,
    PageVisitRecord,
    StatsFreqVisitors,
    StatsFreqVisits,
    PageVisitPayload,
    TrafficData,
    TrafficDataDay,
    PageTrafficData,
    PageTrafficDataObj,
    PageTrafficDataFinal,
    PageTrafficDataObjFinal,
    VisitorVisitsType,
    StatsAnalysisResult,
    StatsReqParams,
    StatsDeviceType,
    StatsDeviceObj,
    StatsPublicChange,
    StatsDevice,
    PageDeviceDimensions,
    DeviceWidthHeight,
    StatsConfig,
    CountryCode,
    dateStandard,
    ServiceConfig,
    configStats,
    startAnalyticsServer,

    // web
    WebConfig,
    setWebConfig,
    webAnalytics,
}