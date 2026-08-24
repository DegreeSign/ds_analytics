import { NumberObj, NumberObjObj, StringObj } from "@degreesign/utils";
import { CountryCode } from "./country";

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

/** running sums for device dimension mean (avoids storing every dim) */
interface DimAccumulator {
    sumW: number,
    sumH: number,
    count: number,
}

/** running sums for filtered visit duration mean (avoids storing every duration) */
interface DurMeanAccumulator {
    sum: number,
    count: number,
}

interface PageVisitBasics {
    /** Visit session Id */
    session: string;
    /** Visit time (ms) */
    timestamp: number;
    /** Visitor Logged In */
    logged?: boolean;
    /** interaction tag (clicks / inviews) */
    tag?: string;
}

interface PageVisitURI {
    /** page URI */
    uri: string;
}

/** type of stats event */
enum StatsEventType {
    pageview = `pageview`,
    click = `click`,
    inview = `inview`,
};

/** recordEvent input for a pageview (no tag) */
interface RecordEventPageViewInput {
    /** Visitor Logged In */
    logged?: boolean;
    eventType: StatsEventType.pageview;
    /** page URI override */
    uriOverride?: string;
}

/** recordEvent input for interaction events (clicks / inviews) — tag is required */
interface RecordEventInteractionInput {
    /** Visitor Logged In */
    logged?: boolean;
    eventType: StatsEventType.click | StatsEventType.inview;
    /** page URI override */
    uriOverride?: string;
    /** interaction tag */
    tag: string;
}

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
}

interface PageTrafficDataFinal extends PageTrafficDataBasics {
    /** Mean time */
    durMean: number,
    /** Counted visits */
    verifiedVisits: number,
}

interface PageTrafficDataObj {
    [pageName: string]: PageTrafficData
}

interface PageTrafficDataObjFinal {
    [pageName: string]: PageTrafficDataObjFinal
}

type VisitorVisitsType = [string, number, number];

/** Object keyed by tag */
interface TaggedObj<T> {
    [tag: string]: T
}

/** Per-tag accumulator for interaction events (clicks / inviews) */
interface TagMetricAccumulator {
    eventTotals: NumberObj,
    visitorsCount: NumberObjObj,
    countriesVisits: TaggedObj<NumberObj>,
    countriesVisitors: TaggedObj<NumberObjObj>,
    deviceVisits: TaggedObj<StatsDeviceObj<number>>,
    deviceVisitors: TaggedObj<NumberObjObj>,
    timeVisits: TaggedObj<NumberObj>,
    timeVisitors: TaggedObj<NumberObjObj>,
}

/** Aggregated metrics for a single interaction tag (clicks / inviews) */
interface StatsTagMetricSet {
    total: number,
    countries: VisitorVisitsType[],
    devices: VisitorVisitsType[],
    /** chartEvents (aka chartVisits) */
    chartEvents: number[],
    chartVisitors: number[],
    visitors: number,
}

/** Interaction metrics (clicks / inviews) grouped per tag */
type StatsTagMetricSets = TaggedObj<StatsTagMetricSet>;

interface StatsAnalysisResult {
    total: number,
    pages: [string, PageTrafficDataFinal][],
    countries: VisitorVisitsType[],
    devices: VisitorVisitsType[],
    chartVisits: number[],
    chartVisitors: number[],
    visitors: number,
    spamVisitors: NumberObj,
    clicks: StatsTagMetricSets,
    inviews: StatsTagMetricSets,
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

interface StatsConfig {
    /** Traffic Server Directory `traffic` */
    trafficDir?: string;
    /** Domain Name `example.com` */
    thisDomain?: string;
    /** Excluded URI [`admin`] */
    excludeURIs?: string[];
    /** Search Engines [`google`] */
    searchEngines?: string[];
    /** URI Alias { home: `HomePage` } */
    uriAlias?: StringObj;
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
    StatsEventType,
    RecordEventPageViewInput,
    RecordEventInteractionInput,
    TaggedObj,
    TagMetricAccumulator,
    StatsTagMetricSet,
    StatsTagMetricSets,
    PageDeviceDimensions,
    DeviceWidthHeight,
    DimAccumulator,
    DurMeanAccumulator,
    StatsConfig,
}
