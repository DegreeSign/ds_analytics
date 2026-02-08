import { NumberObj } from "@degreesign/utils";
import { CountryCode } from "../code/constants";

enum StatsDevice {
    mobile = `mobile`,
    desktop = `desktop`,
};

type StatsDeviceType = keyof typeof StatsDevice;

type StatsDeviceObj<T> = {
    [K in StatsDevice]: T;
};

type DeviceWidthHeight = [number, number];

interface PageDeviceDimensions {
    [pageName: string]: DeviceWidthHeight[];
}

interface PageVisitBasics {
    /** Visit session Id */
    session: string;
    /** Visit time (ms) */
    timestamp: number;
    /** Visitor Logged In */
    logged?: boolean;
}

interface PageVisitURI {
    /** page URI */
    uri: string;
}

/** type of stats event */
type StatsEventType = `pageview` | `click`;

/** Stats recording initiation (server) */
interface PageVisitRecord extends PageVisitBasics {
    /** stats id */
    statsId: string;
    /** event type */
    event: StatsEventType,
    /** Window Width */
    winW: number;
    /** Window Height */
    winH: number;
    /** Referral address */
    referrer?: string;
    /** Duration in seconds */
    dur?: number;
    /** Country Code */
    code?: CountryCode;
}

/** page visit breakdown */
type PageVisitPayload = PageVisitRecord & PageVisitURI;

/** Stats recording initiation (local) */
type PageVisitInitiation = PageVisitBasics & PageVisitURI;

interface TrafficDataDay { // "2025-04-02"
    [pageURI: string]: PageVisitRecord[],
};

interface TrafficData {
    [date: string]: TrafficDataDay
};

interface PageTrafficDataBasics {
    visits: number,
    visitsBounced: number,
    /** Total time in seconds */
    dur: number,
    search: number,
    domain: number,
    other: number,
    users: number,
    devices: StatsDeviceObj<number>,
    devicesDim: StatsDeviceObj<DeviceWidthHeight>,
}

interface PageTrafficData extends PageTrafficDataBasics {
    /** time array (seconds) */
    durArray: number[],
}

interface PageTrafficDataFinal extends PageTrafficDataBasics {
    /** Mean time */
    durMean: number,
    /** Counted visits */
    verifiedVisits: number,
    /** to be deleted in processing */
    durArray?: number[],
}

interface PageTrafficDataObj {
    [pageName: string]: PageTrafficData
}

interface PageTrafficDataObjFinal {
    [pageName: string]: PageTrafficDataObjFinal
}

type VisitorVisitsType = [string, number, number];

interface StatsAnalysisResult {
    total: number,
    pages: [string, PageTrafficDataFinal][],
    countries: VisitorVisitsType[],
    devices: VisitorVisitsType[],
    chartVisits: number[],
    chartVisitors: number[],
    visitors: number,
    spamVisitors: NumberObj,
    freqVisits?: string[];
    /** Raw Data */
    dayDataFiltered?: TrafficDataDay;
}

interface StatsReqParams {
    dayData: TrafficDataDay,
    dateReqStr: string,
    spamVisitorLimit?: number,
    spamVisitsLimit?: number,
    bounceSecondsLimit?: number,
    visitMinSeconds?: number,
    visitCutOffSeconds?: number,
    resolution?: number,
    updateStartTime?: boolean,
    calcFreqVisits?: boolean;
    includeRaw?: boolean;
}

interface StatsFreqVisitors {
    days: number;
    hasAccount: boolean;
    screenSize: string;
    source?: string;
    country: CountryCode;
    pages: string[];
}

interface StatsFreqVisits {
    [visitId: string]: {
        [page: string]: PageVisitRecord[] // timestamps
    }
}

export {
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
    StatsDevice,
    PageDeviceDimensions,
    DeviceWidthHeight,
}