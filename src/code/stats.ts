import {
    rNum,
    NumberObjObj,
    NumberObj,
    DateString,
    dateStandard,
    objLen,
    oneDay,
    oneSec,
    seoDt,
} from "@degreesign/utils";
import {
    redJ,
    safeFolder,
    wrtJ
} from "@degreesign/cache";
import {
    StatsFreqVisits,
    StatsFreqVisitors,
    DeviceWidthHeight,
    PageTrafficDataFinal,
    PageTrafficDataObj,
    StatsDevice,
    StatsDeviceObj,
    StatsDeviceType,
    StatsEventType,
    StatsReqParams,
    VisitorVisitsType,
    PageVisitRecord,
    PageVisitPayload,
    StatsAnalysisResult,
    TagMetricAccumulator,
    StatsTagMetricSets,
    TrafficData,
    TrafficDataDay,
    DimAccumulator,
    DurMeanAccumulator,
    StatsConfig,
} from "../types/stats";
import { IPRange } from "../types/ip";
import { ipCountryCode } from "./analyse";
import { CountryCode, countriesCodes, statsConfig, trafficDataCacheTtl, uriCorrupt, unknownCountryCode } from "./constants";

const
    trafficData: TrafficData = {},
    trafficDataRead: NumberObj = {},
    sessionIndex: {
        [date: string]: {
            [uri: string]: Map<string, number>
        }
    } = {},
    validURI = (uri: string) => {
        if (
            !uri
            || typeof uri != `string`
            || uri.match(uriCorrupt)
        ) return ``
        if (uri.length > 150)
            uri = uri.slice(0, 150);
        return uri
    },
    readStats = (date: string) => {
        try {
            if (!trafficData[date])
                trafficData[date] = redJ(`${statsConfig.trafficDir}${date}.json`, true) || {};
            trafficDataRead[date] = Date.now();
            return trafficData[date];
        } catch (e) {
            console.log(seoDt(), `readStats failed`, e);
            return {};
        };
    },
    saveStats = () => {
        try {
            const
                today = dateStandard(new Date()),
                todayData = readStats(today);
            if (objLen(todayData))
                wrtJ(`${statsConfig.trafficDir}${today}.json`, todayData);

            // evict stale cached days to avoid unbounded memory
            for (const date in trafficData) {
                if (
                    date != today
                    && Date.now() - (trafficDataRead[date] || 0) > trafficDataCacheTtl
                ) {
                    delete trafficData[date];
                    delete trafficDataRead[date];
                    delete sessionIndex[date];
                };
            };
        } catch (e) { console.log(seoDt(), `saveStats failed`, e); };
    },
    getSessionIndex = (date: string, uri: string, visits: PageVisitRecord[]) => {
        let dateIndex = sessionIndex[date];
        if (!dateIndex) dateIndex = sessionIndex[date] = {};
        if (!dateIndex[uri]) {
            const map = new Map<string, number>();
            for (let i = 0; i < visits.length; i++) {
                const session = visits[i].session;
                if (!map.has(session)) map.set(session, i);
            };
            dateIndex[uri] = map;
        };
        return dateIndex[uri];
    },
    recordStats = ({
        ipRange,
        ips,
        data
    }: {
        ipRange: IPRange[],
        ips: string,
        data: PageVisitPayload,
    }) => {
        try {

            // validate data
            const
                today = dateStandard(new Date()),
                uri = validURI(data?.uri),
                session = data?.session,
                dur = data?.dur;

            if (
                !session
                || !uri
            ) return

            const trafficData = readStats(today)
            if (!trafficData[uri])
                trafficData[uri] = [];

            // update data
            const
                visits = trafficData[uri],
                uriIndex = getSessionIndex(today, uri, visits),
                visitIndex = dur ? uriIndex.get(session) : undefined;

            if (
                visitIndex != undefined
                && visits[visitIndex]
            ) {
                visits[visitIndex].dur = dur;

                // add data
            } else {

                const code = ipCountryCode({
                    code: data.code,
                    ips,
                    ipRange,
                });

                visits.push({
                    statsId: data.statsId,
                    session: data.session,
                    timestamp: data.timestamp,
                    event: data.event,
                    winW: data.winW,
                    winH: data.winH,
                    referrer: data.referrer,
                    logged: data.logged ? true : false,
                    code,
                    dur,
                    tag: data.tag,
                });
                if (!uriIndex.has(session))
                    uriIndex.set(session, visits.length - 1);
            }
        } catch (e) {
            console.log(seoDt(), `recordStats failed`, e);
        };
    },
    combineStats = (days: string[]) => {
        const traffic: TrafficDataDay = {};
        for (let i = 0; i < days.length; i++) {
            const d = readStats(days[i]);
            if (objLen(d))
                for (const p in d) {
                    if (!traffic[p]) traffic[p] = [];
                    const src = d[p] || [];
                    for (let j = 0; j < src.length; j++)
                        traffic[p].push(src[j]);
                };
        };
        return traffic
    },
    compareDateStrings = ({
        startDay,
        endDay,
    }: {
        startDay: DateString,
        endDay?: DateString,
    }): string[] | undefined => {

        try {

            if (!startDay) return

            const
                dateReqStrArray: string[] = [],
                startTime = new Date(startDay).getTime();

            // one day
            if (startDay == endDay || !endDay) {
                dateReqStrArray.push(startDay);
                const prvDay = dateStandard(startTime - oneDay);
                dateReqStrArray.push(prvDay);

                // range of days
            } else {
                const
                    endTime = new Date(endDay).getTime(),
                    days = Math.round((endTime - startTime) / oneDay),
                    { thisPeriod, prvPeriod } = statsPeriodStr({ endTime, days });
                dateReqStrArray.push(thisPeriod);
                dateReqStrArray.push(prvPeriod);
            };

            return dateReqStrArray

        } catch (e) {
            console.log(seoDt(), `compareDateStrings failed`, startDay, endDay, e)
        };
    },
    compareStats = ({
        startDay,
        endDay,
        includeRaw,
    }: {
        startDay: DateString;
        endDay?: DateString;
        includeRaw?: boolean;
    }): (StatsAnalysisResult | undefined)[] | undefined => {
        try {
            return compareDateStrings({
                startDay,
                endDay
            })?.map((dateReqStr) => analyseStats({
                dateReqStr,
                dayData: combineStats(dateReqStr?.split(`,`)),
                includeRaw,
            }));
        } catch (e) {
            console.log(seoDt(), `compareStats failed`, startDay, endDay, e)
        };
    },
    compare24hr = (
        includeRaw = false
    ): (StatsAnalysisResult | undefined)[] | undefined => {

        try {

            const
                todayCutOff = new Date().getTime(),
                todayDate = dateStandard(todayCutOff),
                yesterdayCutOff = todayCutOff - oneDay,
                yesterdayDate = dateStandard(yesterdayCutOff),
                prvCutOff = todayCutOff - (oneDay * 2),
                trafficToday: TrafficDataDay = {},
                trafficYesterday: TrafficDataDay = {};

            // bucket visits directly from each day (no merged intermediate)
            for (const date of [
                todayDate, // today
                yesterdayDate, // yesterday
                dateStandard(prvCutOff), // preceding day
            ]) {
                const day = readStats(date);
                for (const page in day) {
                    const visits = day[page];
                    for (let i = 0; i < visits.length; i++) {
                        const visit = visits[i];
                        if (visit.timestamp > yesterdayCutOff) {
                            if (!trafficToday[page]) trafficToday[page] = [];
                            trafficToday[page].push(visit);
                        } else if (visit.timestamp > prvCutOff) {
                            if (!trafficYesterday[page]) trafficYesterday[page] = [];
                            trafficYesterday[page].push(visit);
                        };
                    };
                };
            };
            return [
                analyseStats({
                    dateReqStr: todayDate,
                    dayData: trafficToday,
                    resolution: 48, // every 30 mins
                    updateStartTime: true,
                    includeRaw,
                }),
                analyseStats({
                    dateReqStr: yesterdayDate,
                    dayData: trafficYesterday,
                    resolution: 48, // every 30 mins
                    updateStartTime: true,
                    includeRaw,
                })
            ];

        } catch (e) {
            console.log(seoDt(), `compare24hr failed`, e)
        };
    },
    getURIAlias = (uri: string) => {
        for (const check in statsConfig.uriAlias)
            if (uri?.includes(check))
                return statsConfig.uriAlias[check];
        return uri
    },
    getPeriodStr = ({
        num,
        endTime = Date.now(),
    }: {
        num: number,
        endTime?: number,
    }) => Array
        .from({ length: num }, (_, i) => i)
        .map(n => {
            return dateStandard(endTime - oneDay * n)
        }).join(`,`),
    statsPeriodStr = ({
        days,
        endTime = Date.now(),
    }: {
        days: number,
        endTime?: number,
    }): {
        thisPeriod: string,
        prvPeriod: string
    } => {
        try {
            const
                thisPeriod = getPeriodStr({
                    num: days,
                    endTime,
                }),
                prvPeriod = getPeriodStr({
                    num: days,
                    endTime: endTime - days * oneDay,
                });
            return {
                thisPeriod,
                prvPeriod,
            };
        } catch {
            return {
                thisPeriod: ``,
                prvPeriod: ``,
            };
        };
    },
    statsAddOne = ({
        typeName,
        visitsObj,
        visitorsObj,
        visitId,
    }: {
        typeName: string,
        visitsObj: NumberObj,
        visitorsObj: NumberObjObj,
        visitId: string,
    }) => {
        visitsObj[typeName] =
            (visitsObj[typeName] || 0) + 1;
        if (!visitorsObj[typeName]) visitorsObj[typeName] = {};
        visitorsObj[typeName][visitId] = 1;
    },
    formatVisits = ({
        visitors,
        visits,
    }: {
        visitors: NumberObjObj,
        visits: NumberObj,
    }) => Object.entries(visitors)
        ?.map(([item, visitorsObj]: [string, number | NumberObj]) => {
            return [
                item,
                objLen(visitorsObj), // visitors
                visits[item] || 0, // visits
            ] as VisitorVisitsType;
        })?.sort(
            ([, visitorsA], [, visitorsB]) =>
                visitorsA > visitorsB ? -1 : 1
        ),
    freqVisits = ({
        visitorsCount,
        freqVisitors,
    }: {
        visitorsCount: NumberObj;
        freqVisitors: StatsFreqVisits;
    }) => {
        try {
            const freqVisitorsArray = Object.entries(visitorsCount)
                ?.filter(a => a[1] > 2)
                ?.sort((a, b) => a[1] > b[1] ? -1 : 1);
            return freqVisitorsArray.map(([visitId]) => {
                let minTime = 0, maxTime = 0;
                const
                    data = Object.entries(freqVisitors[visitId]),
                    hasAccount = data.find(([, visits]) => visits.find(p => p.logged)) ? true : false,
                    firstVisit = data[0][1][0],
                    device = firstVisit.winW > firstVisit.winH ? `desktop` : `mobile`,
                    screenSize = `${firstVisit.winW}x${firstVisit.winH} (${device})`,
                    source = data.find(([, visits]) => visits.find(p =>
                        p.referrer
                        && (!statsConfig.thisDomain || !p.referrer?.includes(statsConfig.thisDomain))
                    ))?.[1]?.[0]?.referrer,
                    country = (
                        data.find(([, visits]) => visits.find(p => p.code))
                            ?.[1]?.[0]?.code as CountryCode
                    ) || unknownCountryCode,
                    pages = data.map(([uri, visits]) => {
                        const
                            visitsArr = visits
                                .sort((a, b) => a.timestamp > b.timestamp ? -1 : 1)
                                .map(p => {

                                    if (!minTime || minTime > p.timestamp)
                                        minTime = p.timestamp;

                                    if (!maxTime || maxTime < p.timestamp)
                                        maxTime = p.timestamp;

                                    return p.timestamp
                                }),
                            days = rNum((visitsArr[0] - visitsArr[visitsArr.length - 1]) / oneDay, 0)
                        return `${uri}` +
                            (visits.length > 1 ? ` x${visits.length}` : ``) +
                            (days > 1 ? ` (${days} days)` : ``)
                    }),
                    days = rNum((maxTime - minTime) / oneDay),
                    statsData: StatsFreqVisitors = {
                        days,
                        hasAccount,
                        screenSize,
                        source,
                        country,
                        pages,
                    };
                return [visitId, statsData] as [string, StatsFreqVisitors]
            })
                ?.filter(([id, data]) => id != `undefined` && data.days > 3)
                ?.sort((a, b) => a[1].country > b[1].country ? -1 : 1)
                ?.sort((a, b) => a[1].hasAccount && !b[1].hasAccount ? -1 : 1)
                ?.map(([, data]) => {
                    const
                        source = (
                            data.source && !data.source?.includes(`coinexams`) ?
                                data.source.split(`.`)[1]?.toUpperCase() : ``
                        ) || ``
                    return `${rNum(data.days, 0)} days | ${data.hasAccount ? `user` : `visitor`} | ${data.country} > ${data.screenSize} > ${source} > ${data.pages?.join(`,`)}`
                })
        } catch (e) {
            console.log(seoDt(), `freqVisits failed`, e);
        };
        return []
    },
    chartSeries = ({
        timeVisits,
        timeVisitors,
        resolution,
        days,
        updateStartTime,
    }: {
        timeVisits: NumberObj,
        timeVisitors: NumberObjObj,
        resolution: number,
        days: string[],
        updateStartTime?: boolean,
    }) => {
        const
            msInterval = (days?.length * oneDay) / resolution,
            timestampList = Object.keys(timeVisits)
                ?.map(n => +n)
                ?.sort((a, b) => a - b),
            timeStart = updateStartTime ? timestampList[0]
                : new Date(days[days.length - 1]).getTime(),
            chartVisits: number[] = [],
            chartVisitors: number[] = [],
            visitorCounts: NumberObj = {};

        // precompute unique visitors per timestamp (avoids Object.keys in the bucket loop)
        for (let i = 0; i < timestampList.length; i++)
            visitorCounts[timestampList[i]] = objLen(timeVisitors[timestampList[i]]);

        // single monotonic scan over sorted timestamps (buckets are [start, end))
        let t = 0;
        for (let i = 0; i < resolution; i++) {
            const
                start = timeStart + msInterval * i,
                isLast = i == resolution - 1,
                end = isLast ? Infinity : start + msInterval;
            chartVisits[i] = chartVisits[i] || 0;
            chartVisitors[i] = chartVisitors[i] || 0;
            while (t < timestampList.length && timestampList[t] < end) {
                if (timestampList[t] >= start) {
                    const timestamp = timestampList[t];
                    chartVisits[i] += timeVisits[timestamp] || 0;
                    chartVisitors[i] += visitorCounts[timestamp];
                };
                t++;
            };
        };
        return { chartVisits, chartVisitors }
    },
    tagAccumulator = (): TagMetricAccumulator => ({
        eventTotals: {},
        visitorsCount: {},
        countriesVisits: {},
        countriesVisitors: {},
        deviceVisits: {},
        deviceVisitors: {},
        timeVisits: {},
        timeVisitors: {},
    }),
    tagVisitAdd = ({
        tagTotals,
        tag,
        visitData,
        visitId,
        deviceType,
    }: {
        tagTotals: TagMetricAccumulator,
        tag: string,
        visitData: PageVisitRecord,
        visitId: string,
        deviceType: StatsDeviceType,
    }) => {
        // time series
        if (!tagTotals.timeVisits[tag]) tagTotals.timeVisits[tag] = {};
        tagTotals.timeVisits[tag][visitData.timestamp] =
            (tagTotals.timeVisits[tag][visitData.timestamp] || 0) + 1;
        if (!tagTotals.timeVisitors[tag]) tagTotals.timeVisitors[tag] = {};
        if (!tagTotals.timeVisitors[tag][visitData.timestamp]) tagTotals.timeVisitors[tag][visitData.timestamp] = {};
        tagTotals.timeVisitors[tag][visitData.timestamp][visitId] =
            (tagTotals.timeVisitors[tag][visitData.timestamp][visitId] || 0) + 1;

        // country
        if (!tagTotals.countriesVisits[tag]) tagTotals.countriesVisits[tag] = {};
        if (!tagTotals.countriesVisitors[tag]) tagTotals.countriesVisitors[tag] = {};
        statsAddOne({
            typeName: visitData.code && countriesCodes[visitData.code] ?
                visitData.code : unknownCountryCode,
            visitsObj: tagTotals.countriesVisits[tag],
            visitorsObj: tagTotals.countriesVisitors[tag],
            visitId
        });

        // device
        if (!tagTotals.deviceVisits[tag]) tagTotals.deviceVisits[tag] = {
            mobile: 0,
            desktop: 0,
        };
        if (!tagTotals.deviceVisitors[tag]) tagTotals.deviceVisitors[tag] = {};
        statsAddOne({
            typeName: deviceType,
            visitsObj: tagTotals.deviceVisits[tag],
            visitorsObj: tagTotals.deviceVisitors[tag],
            visitId
        });

        // totals
        tagTotals.eventTotals[tag] = (tagTotals.eventTotals[tag] || 0) + 1;
        if (!tagTotals.visitorsCount[tag]) tagTotals.visitorsCount[tag] = {};
        tagTotals.visitorsCount[tag][visitId] =
            (tagTotals.visitorsCount[tag][visitId] || 0) + 1;
    },
    buildTagMetrics = ({
        tagTotals,
        dateReqStr,
        resolution,
        updateStartTime,
    }: {
        tagTotals: TagMetricAccumulator,
        dateReqStr: string,
        resolution: number,
        updateStartTime?: boolean,
    }): StatsTagMetricSets => {
        const
            days = dateReqStr?.split(`,`),
            tagMetrics: StatsTagMetricSets = {};
        for (const tag in tagTotals.eventTotals) {
            const
                { chartVisits, chartVisitors } = chartSeries({
                    timeVisits: tagTotals.timeVisits[tag] || {},
                    timeVisitors: tagTotals.timeVisitors[tag] || {},
                    resolution,
                    days,
                    updateStartTime,
                });
            tagMetrics[tag] = {
                total: tagTotals.eventTotals[tag],
                countries: formatVisits({
                    visitors: tagTotals.countriesVisitors[tag] || {},
                    visits: tagTotals.countriesVisits[tag] || {},
                }),
                devices: formatVisits({
                    visitors: tagTotals.deviceVisitors[tag] || {},
                    visits: tagTotals.deviceVisits[tag] || {},
                }),
                chartEvents: chartVisits,
                chartVisitors,
                visitors: objLen(tagTotals.visitorsCount[tag]),
            };
        };
        return tagMetrics
    },
    analyseStats = ({
        dayData,
        dateReqStr,
        spamVisitorLimit = 3,
        spamVisitsLimit = 10,
        bounceSecondsLimit = 4,
        visitMinSeconds = 10,
        visitCutOffSeconds = 1200,
        resolution,
        updateStartTime,
        calcFreqVisits,
        includeRaw,
    }: StatsReqParams): StatsAnalysisResult | undefined => {

        try {

            let
                searchRef = 0,
                thisDomainRef = 0,
                otherRef = 0,
                totalVisits = 0,
                totalVisitsBounced = 0,
                totalDurSum = 0,
                totalDurMeanSum = 0,
                totalDurMeanCount = 0;

            const
                visitorsCount: NumberObj = {},
                freqVisitors: StatsFreqVisits = {},
                countriesVisits: NumberObj = {},
                countriesVisitors: NumberObjObj = {},
                deviceVisits: StatsDeviceObj<number> = {
                    mobile: 0,
                    desktop: 0,
                },
                deviceVisitors: NumberObjObj = {},
                timeVisitors: NumberObjObj = {},
                timeVisits: NumberObj = {},
                pageVisitors: NumberObjObj = {},
                dayDataTarget: TrafficDataDay = {},
                dayDataFiltered: TrafficDataDay = {},
                spamVisitors: NumberObj = {},
                spamTimestamps: NumberObj = {},
                dimAccumulator = (): DimAccumulator => ({ sumW: 0, sumH: 0, count: 0 }),
                durMeanAccumulator = (): DurMeanAccumulator => ({ sum: 0, count: 0 }),
                mobileDimAccum: { [pageName: string]: DimAccumulator } = {},
                desktopDimAccum: { [pageName: string]: DimAccumulator } = {},
                durMeanAccum: { [pageName: string]: DurMeanAccumulator } = {},
                mobileAllAcc = dimAccumulator(),
                desktopAllAcc = dimAccumulator(),
                dimMean = (acc?: DimAccumulator): DeviceWidthHeight =>
                    acc?.count
                        ? [
                            Math.round((acc.sumW / acc.count) / 10) * 10,
                            Math.round((acc.sumH / acc.count) / 10) * 10,
                        ]
                        : [0, 0],
                dataObj: PageTrafficDataObj = {},
                clicksAccumulator = tagAccumulator(),
                inviewsAccumulator = tagAccumulator(),
                allTimeVisits: NumberObj = {},
                allTimeVisitors: NumberObjObj = {};

            // build all-time counts (for spam detection)
            for (const uri in dayData) {

                if (
                    statsConfig.excludeURIs?.length
                    && statsConfig.excludeURIs?.find(page => uri?.includes(page))
                ) continue;

                const visits = dayData[uri];

                dayDataTarget[uri] = visits;

                for (let i = 0; i < visits.length; i++) {
                    const
                        visitData = visits[i],
                        timestamp = visitData.timestamp;
                    if (!visitData.statsId) continue;
                    allTimeVisits[timestamp] =
                        (allTimeVisits[timestamp] || 0) + 1;
                    if (!allTimeVisitors[timestamp]) allTimeVisitors[timestamp] = {};
                    allTimeVisitors[timestamp][visitData.statsId] =
                        (allTimeVisitors[timestamp]?.[visitData.statsId] || 0) + 1;
                };
            };

            // identify spam
            for (const timestamp in allTimeVisits) {
                const visitors = allTimeVisitors[timestamp];

                // visitors spam
                for (const visitId in visitors) {
                    const visits = visitors[visitId];
                    if (visits > spamVisitorLimit) {
                        allTimeVisits[timestamp] -= visits; // remove spam visits
                        delete visitors[visitId] // remove spam visitor
                        spamVisitors[visitId] = visits; // record spam visitor
                    };
                };

                // visits spam
                if (allTimeVisits[timestamp] > spamVisitsLimit) {
                    spamTimestamps[timestamp] = allTimeVisits[timestamp];
                    delete allTimeVisits[timestamp];
                };
            };

            // chart
            const
                days = dateReqStr?.split(`,`),
                daysCount = days?.length;

            resolution = resolution || (
                daysCount == 1 ? 24
                    : daysCount == 7 ? 14
                        : daysCount
            );

            // process pages
            for (const uri in dayDataTarget) {

                let
                    uriVisits = 0,
                    uriVisitsBounced = 0,
                    searchRefValue = 0,
                    thisDomainRefValue = 0,
                    otherRefV = 0,
                    mobileVisits = 0,
                    desktopVisits = 0,
                    uriDurSum = 0,
                    uriDurMeanSum = 0,
                    uriDurMeanCount = 0;

                const
                    pageName = uri == `/` ? `Home`
                        : getURIAlias(uri),
                    visits = dayDataTarget[uri];

                if (!pageVisitors[pageName]) pageVisitors[pageName] = {};

                // process page visits
                for (let i = 0; i < visits.length; i++) {

                    const
                        visitData = visits[i],
                        timestamp = visitData.timestamp,
                        visitId = visitData.statsId;

                    if (!visitId) continue;

                    // exclude spam
                    if (spamVisitors[visitId] || spamTimestamps[timestamp]) continue;

                    if (includeRaw) {
                        if (!dayDataFiltered[uri]) dayDataFiltered[uri] = [];
                        dayDataFiltered[uri].push(visitData);
                    };

                    const
                        deviceType = visitData.winW < 900 ? StatsDevice.mobile : StatsDevice.desktop,
                        isMobile = deviceType == StatsDevice.mobile;

                    // time series (pageviews)
                    if (visitData.event == StatsEventType.pageview) {
                        timeVisits[timestamp] =
                            (timeVisits[timestamp] || 0) + 1;
                        if (!timeVisitors[timestamp]) timeVisitors[timestamp] = {};
                        timeVisitors[timestamp][visitId] =
                            (timeVisitors[timestamp]?.[visitId] || 0) + 1;
                    };

                    // interaction events (clicks / inviews) — per tag, not counted as visits
                    if (
                        visitData.event == StatsEventType.click
                        || visitData.event == StatsEventType.inview
                    ) {
                        tagVisitAdd({
                            tagTotals: visitData.event == StatsEventType.click ? clicksAccumulator : inviewsAccumulator,
                            tag: visitData.tag || uri,
                            visitData,
                            visitId,
                            deviceType,
                        });
                        continue
                    };

                    if (visitData.event != StatsEventType.pageview) continue;

                    // country
                    statsAddOne({
                        typeName: visitData.code && countriesCodes[visitData.code] ?
                            visitData.code : unknownCountryCode,
                        visitsObj: countriesVisits,
                        visitorsObj: countriesVisitors,
                        visitId
                    });

                    // device
                    statsAddOne({
                        typeName: deviceType,
                        visitsObj: deviceVisits,
                        visitorsObj: deviceVisitors,
                        visitId
                    });
                    isMobile ? mobileVisits++ : desktopVisits++;

                    // dimensions
                    const dimAccum = isMobile ? mobileDimAccum : desktopDimAccum;
                    if (!dimAccum[pageName]) dimAccum[pageName] = dimAccumulator();
                    dimAccum[pageName].sumW += visitData.winW;
                    dimAccum[pageName].sumH += visitData.winH;
                    dimAccum[pageName].count++;
                    const allAcc = isMobile ? mobileAllAcc : desktopAllAcc;
                    allAcc.sumW += visitData.winW;
                    allAcc.sumH += visitData.winH;
                    allAcc.count++;

                    // referral
                    const referrer = visitData.referrer;
                    if (
                        statsConfig.searchEngines?.length
                        && statsConfig.searchEngines.find(search => referrer?.includes(search))
                    ) {
                        searchRefValue += 1;
                        searchRef += 1;
                    } else if (
                        statsConfig.thisDomain
                        && referrer?.includes(statsConfig.thisDomain)
                    ) {
                        thisDomainRefValue += 1;
                        thisDomainRef += 1;
                    } else if (referrer) {
                        otherRefV += 1;
                        otherRef += 1;
                    };

                    // duration
                    const duration = visitData?.dur || 0;
                    uriDurSum += duration;
                    totalDurSum += duration;
                    if (visitMinSeconds < duration && duration < visitCutOffSeconds) {
                        uriDurMeanSum += duration;
                        uriDurMeanCount++;
                        totalDurMeanSum += duration;
                        totalDurMeanCount++;
                    };

                    // pages
                    uriVisits++;
                    if (!pageVisitors[pageName][visitId])
                        pageVisitors[pageName][visitId] = 1;
                    pageVisitors[pageName][visitId] += 1;

                    // totals
                    totalVisits++;
                    if (!visitorsCount[visitId])
                        visitorsCount[visitId] = 1;
                    visitorsCount[visitId] += 1;

                    // frequent
                    if (calcFreqVisits) {
                        if (!freqVisitors[visitId]) freqVisitors[visitId] = {};
                        if (!freqVisitors[visitId][pageName]) freqVisitors[visitId][pageName] = [];
                        freqVisitors[visitId][pageName].push(visitData);
                    };

                    // bounce
                    if (duration && duration < bounceSecondsLimit) {
                        uriVisitsBounced++;
                        totalVisitsBounced++;
                    };
                };

                // totals
                if (!durMeanAccum[pageName]) durMeanAccum[pageName] = durMeanAccumulator();
                durMeanAccum[pageName].sum += uriDurMeanSum;
                durMeanAccum[pageName].count += uriDurMeanCount;
                if (!dataObj[pageName]) dataObj[pageName] = {
                    visits: 0,
                    visitsBounced: 0,
                    dur: 0,
                    search: 0,
                    domain: 0,
                    other: 0,
                    users: 0,
                    devices: {
                        mobile: 0,
                        desktop: 0,
                    },
                    devicesDim: {
                        mobile: [0, 0],
                        desktop: [0, 0],
                    },
                };
                dataObj[pageName].visits += uriVisits;
                dataObj[pageName].visitsBounced += uriVisitsBounced;
                dataObj[pageName].dur += uriDurSum;
                dataObj[pageName].search += searchRefValue;
                dataObj[pageName].domain += thisDomainRefValue;
                dataObj[pageName].other += otherRefV;
                dataObj[pageName].devices.mobile += mobileVisits;
                dataObj[pageName].devices.desktop += desktopVisits;
            };

            // chart
            const
                { chartVisits, chartVisitors } = chartSeries({
                    timeVisits,
                    timeVisitors,
                    resolution,
                    days,
                    updateStartTime,
                });

            // page visitors + dimensions
            for (const pageName in dataObj) {
                dataObj[pageName].users = objLen(pageVisitors[pageName]);
                dataObj[pageName].devicesDim = {
                    mobile: dimMean(mobileDimAccum[pageName]),
                    desktop: dimMean(desktopDimAccum[pageName]),
                };
            };

            const
                totalVisitors = objLen(visitorsCount),
                countriesVisitsArray = formatVisits({
                    visitors: countriesVisitors,
                    visits: countriesVisits,
                }),
                deviceVisitsArray = formatVisits({
                    visitors: deviceVisitors,
                    visits: deviceVisits,
                }),
                pagesList = Object.entries(dataObj);

            // process pages list
            pagesList.push([`total_visits`, {
                search: searchRef,
                domain: thisDomainRef,
                other: otherRef,
                visits: totalVisits,
                visitsBounced: totalVisitsBounced,
                dur: totalDurSum,
                users: totalVisitors,
                devices: deviceVisits,
                devicesDim: {
                    mobile: dimMean(mobileAllAcc),
                    desktop: dimMean(desktopAllAcc)
                },
            }]);

            // finalise page
            const pagesListFinal: [string, PageTrafficDataFinal][] = [];
            for (let i = 0; i < pagesList.length; i++) {
                const
                    [page, data] = pagesList[i],
                    durAccum = page == `total_visits`
                        ? { sum: totalDurMeanSum, count: totalDurMeanCount }
                        : durMeanAccum[page] || { sum: 0, count: 0 },
                    newData: PageTrafficDataFinal = {
                        ...data,
                        // mean time filter
                        durMean: durAccum.count ? durAccum.sum / durAccum.count : 0,
                        verifiedVisits: durAccum.count,
                    };
                pagesListFinal.push([page, newData]);
            };
            pagesListFinal.sort((a, b) =>
                a[1].users > b[1].users ? -1
                    : a[1].visits == b[1].visits && a[1].durMean > b[1].durMean ? -1
                        : 1
            );

            return {
                total: totalVisits,
                pages: pagesListFinal,
                countries: countriesVisitsArray,
                devices: deviceVisitsArray,
                chartVisits,
                chartVisitors,
                visitors: totalVisitors,
                spamVisitors,
                clicks: buildTagMetrics({
                    tagTotals: clicksAccumulator,
                    dateReqStr,
                    resolution,
                    updateStartTime,
                }),
                inviews: buildTagMetrics({
                    tagTotals: inviewsAccumulator,
                    dateReqStr,
                    resolution,
                    updateStartTime,
                }),
                ...calcFreqVisits ? {
                    freqVisits: freqVisits({ visitorsCount, freqVisitors }),
                } : {},
                ...!includeRaw ? {} : { dayDataFiltered },
            };
        } catch (e) {
            console.log(seoDt(), `analyseStats failed`, dateReqStr, e);
        };
    },
    /** Config Stats */
    configStats = (config: StatsConfig) => {
        statsConfig.trafficDir = config.trafficDir || statsConfig.trafficDir;
        statsConfig.thisDomain = config.thisDomain || ``;
        statsConfig.excludeURIs = config.excludeURIs || [];
        statsConfig.searchEngines = config.searchEngines || [];
        statsConfig.uriAlias = config.uriAlias || {};
    },
    /** Start Stats */
    startStats = () => {
        try {
            safeFolder(statsConfig.trafficDir || ``);
            setInterval(saveStats, oneSec * 15);
        } catch (e) {
            console.log(seoDt(), `startStats failed`, e);
        };
    };

export {
    statsConfig,
    configStats,
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
};