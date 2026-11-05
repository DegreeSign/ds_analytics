import { existsSync } from "node:fs";
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
    SessionIndex,
    DimAccumulator,
    DurMeanAccumulator,
    StatsConfig,
} from "../types/stats";
import { IPRange } from "../types/ip";
import { ipCountryCode } from "./analyse";
import {
    CountryCode,
    countriesCodes,
    statsConfig,
    trafficDataCacheTtl,
    controlCorrupt,
    dateKeyShape,
    uriCorrupt,
    reservedKeys,
    sessionMaxLength,
    statsIdMaxLength,
    tagMaxLength,
    dimensionMax,
    durationMax,
    reportDaysMax,
    reportResolutionMax,
    timestampFutureLimit,
    unknownCountryCode,
} from "./constants";
import {
    createDictionary,
    clampNumber,
    validText,
    validKey,
    validReferrer,
    validNumber,
    validEvent,
    validPageVisitPayload,
} from "./validation";
import { writeJsonAtomic } from "./storage";

const
    trafficData: TrafficData = createDictionary(),
    trafficDataRead: NumberObj = {},
    sessionIndex: SessionIndex = createDictionary(),
    validURI = (uri: string) => {
        if (
            !uri
            || typeof uri != `string`
        ) return ``
        if (uri.length > 150)
            uri = uri.slice(0, 150);
        if (
            uri[0] != `/`
            || uri.match(uriCorrupt)
            || uri.match(controlCorrupt)
        ) return ``
        return uri
    },
    /** Optional visit identity */
    validVisitIdentity = ({
        value,
        maximum,
    }: {
        value?: string,
        maximum: number,
    }) =>
        validText({
            text: value,
            maximum,
        }) && validKey(value)
            ? value
            : undefined,
    /** Sanitise optional fields */
    sanitiseVisitFields = ({
        tag,
        referrer,
        code,
        winW,
        winH,
        dur,
    }: {
        tag?: string,
        referrer?: string,
        code?: CountryCode,
        winW?: number,
        winH?: number,
        dur?: number,
    }) => ({
        tag: validText({
            text: tag,
            maximum: tagMaxLength,
        }) && validKey(tag)
            ? tag
            : undefined,
        referrer: validReferrer(referrer) && referrer
            ? referrer
            : undefined,
        code: code !== undefined && Object.hasOwn(countriesCodes, code)
            ? code
            : undefined,
        winW: winW !== undefined && validNumber({ value: winW })
            ? Math.min(winW, dimensionMax)
            : undefined,
        winH: winH !== undefined && validNumber({ value: winH })
            ? Math.min(winH, dimensionMax)
            : undefined,
        dur: dur !== undefined && validNumber({
            value: dur,
            maximum: Number.MAX_VALUE,
        })
            ? Math.min(dur, durationMax)
            : undefined,
    }),
    /** Reportable visit fallback */
    reportableVisit = (visit: PageVisitRecord) => {
        if (!visit.statsId) visit.statsId = visit.session;
        if (!visit.event) visit.event = StatsEventType.pageview;
        return visit
    },
    /** Valid stored visit */
    validStoredVisit = (visit: PageVisitRecord) => {
        if (
            !visit
            || typeof visit != `object`
            || Array.isArray(visit)
        ) return false
        if (
            typeof visit.timestamp != `number`
            || !isFinite(visit.timestamp)
        ) return false
        if (!validEvent(visit.event)) return false
        if (visit.logged !== undefined && typeof visit.logged != `boolean`) return false

        // sanitise optional fields
        const
            statsId = validVisitIdentity({
                value: visit.statsId,
                maximum: statsIdMaxLength,
            }),
            session = validVisitIdentity({
                value: visit.session,
                maximum: sessionMaxLength,
            });
        if (!statsId && !session) return false
        Object.assign(visit, {
            ...sanitiseVisitFields(visit),
            statsId,
            session,
        });
        return true
    },
    readStats = (date: string): TrafficDataDay | undefined => {
        try {
            if (!dateKeyShape.test(date)) return;
            const cachedDay = trafficData[date];
            if (cachedDay) {
                trafficDataRead[date] = Date.now();
                return cachedDay;
            };
            const
                filePath = `${statsConfig.trafficDir}${date}.json`,
                day: TrafficDataDay = createDictionary();
            if (existsSync(filePath)) {
                const storedDay = redJ<TrafficDataDay>(filePath, true);
                if (
                    !storedDay
                    || typeof storedDay != `object`
                    || Array.isArray(storedDay)
                ) return;
                for (const uri in storedDay) {
                    if (!Object.hasOwn(storedDay, uri)) continue;
                    const
                        safeUri = validURI(uri),
                        visits = storedDay[uri];
                    if (!safeUri || !Array.isArray(visits)) continue;
                    const validVisits: PageVisitRecord[] = [];
                    for (let i = 0; i < visits.length; i++) {
                        const visit = visits[i];
                        if (!validStoredVisit(visit)) continue;
                        validVisits.push(reportableVisit(visit));
                    };
                    if (validVisits.length)
                        day[safeUri] = (day[safeUri] || []).concat(validVisits);
                };
            };
            trafficData[date] = day;
            trafficDataRead[date] = Date.now();
            return day;
        } catch (e) {
            console.log(seoDt(), `readStats failed`, e);
            return;
        };
    },
    saveStats = () => {
        try {
            const
                today = dateStandard(new Date()),
                todayData = readStats(today);
            if (
                todayData
                && objLen(todayData)
                && !writeJsonAtomic({
                    filePath: `${statsConfig.trafficDir}${today}.json`,
                    data: todayData,
                })
            ) return;

            // evict stale cached days
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
        if (!dateIndex) dateIndex = sessionIndex[date] = createDictionary<SessionIndex[string]>();
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
    }): boolean => {
        try {

            // apply documented payload fallbacks
            const payload = {
                ...data,
                statsId: data?.statsId || data?.session,
                event: data?.event === undefined
                    ? StatsEventType.pageview
                    : data.event,
            };

            // require canonical visit shape
            if (!validPageVisitPayload(payload)) return false

            // sanitise optional payload fields
            const
                now = Date.now(),
                today = dateStandard(new Date(now)),
                uri = validURI(payload.uri),
                session = validVisitIdentity({
                    value: payload.session,
                    maximum: sessionMaxLength,
                }),
                statsId = validVisitIdentity({
                    value: payload.statsId,
                    maximum: statsIdMaxLength,
                }),
                event = payload.event,
                logged = payload.logged === true,
                durationProvided = payload.dur !== undefined,
                {
                    tag,
                    referrer,
                    code: requestCode,
                    winW,
                    winH,
                    dur,
                } = sanitiseVisitFields({
                    tag: payload.tag,
                    referrer: payload.referrer,
                    code: payload.code,
                    winW: payload.winW,
                    winH: payload.winH,
                    dur: payload.dur,
                }),
                // clamp skewed timestamps
                timestamp = payload.timestamp > now - oneDay
                    && payload.timestamp < now + timestampFutureLimit
                    ? payload.timestamp
                    : now;

            // skip degraded visits
            if (!session || !uri) return true

            const trafficData = readStats(today)
            // skip storage failure
            if (!trafficData) return true;
            let visits = trafficData[uri];

            if (!visits)
                visits = trafficData[uri] = [];

            // update data
            const
                uriIndex = getSessionIndex(today, uri, visits),
                visitIndex = durationProvided ? uriIndex.get(session) : undefined;

            if (
                visitIndex != undefined
                && visits[visitIndex]
            ) {
                if (dur !== undefined)
                    visits[visitIndex].dur = dur;

                // add data
            } else {

                const code = ipCountryCode({
                    code: requestCode,
                    ips,
                    ipRange,
                });

                // optional fields allowed
                visits.push(reportableVisit({
                    statsId,
                    session,
                    timestamp,
                    event,
                    winW,
                    winH,
                    referrer,
                    logged,
                    code,
                    dur,
                    tag,
                } as PageVisitRecord));
                if (!uriIndex.has(session))
                    uriIndex.set(session, visits.length - 1);
            }

            return true
        } catch (e) {
            console.log(seoDt(), `recordStats failed`, e);
            return true
        };
    },
    combineStats = (days: string[]) => {
        const
            dayCount = Math.min(days.length, reportDaysMax),
            traffic: TrafficDataDay = createDictionary();
        for (let i = 0; i < dayCount; i++) {
            const d = readStats(days[i]);
            if (!d) continue;
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

            if (!isFinite(startTime)) return

            // one day
            if (startDay == endDay || !endDay) {
                dateReqStrArray.push(startDay);
                const prvDay = dateStandard(startTime - oneDay);
                dateReqStrArray.push(prvDay);

                // range of days
            } else {
                const
                    endTime = new Date(endDay).getTime();

                if (!isFinite(endTime)) return

                const days = Math.round((endTime - startTime) / oneDay);

                if (days < 1 || days > reportDaysMax) return

                const { thisPeriod, prvPeriod } = statsPeriodStr({ endTime, days });
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
                trafficToday: TrafficDataDay = createDictionary(),
                trafficYesterday: TrafficDataDay = createDictionary();

            // bucket visits per day
            for (const date of [
                todayDate, // today
                yesterdayDate, // yesterday
                dateStandard(prvCutOff), // preceding day
            ]) {
                const day = readStats(date);
                if (!day) continue;
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
        .from({
            length: clampNumber({
                value: num,
                minimum: 1,
                maximum: reportDaysMax,
            }),
        }, (_, i) => i)
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
                daysClamped = clampNumber({
                    value: days,
                    minimum: 1,
                    maximum: reportDaysMax,
                }),
                thisPeriod = getPeriodStr({
                    num: daysClamped,
                    endTime,
                }),
                prvPeriod = getPeriodStr({
                    num: daysClamped,
                    endTime: endTime - daysClamped * oneDay,
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
        if (
            reservedKeys.includes(typeName)
            || reservedKeys.includes(visitId)
        ) return
        visitsObj[typeName] =
            (visitsObj[typeName] || 0) + 1;
        if (!visitorsObj[typeName]) visitorsObj[typeName] = createDictionary();
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

        // precompute visitor counts
        for (let i = 0; i < timestampList.length; i++)
            visitorCounts[timestampList[i]] = objLen(timeVisitors[timestampList[i]]);

        // single monotonic bucket scan
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
        eventTotals: createDictionary(),
        visitorsCount: createDictionary(),
        countriesVisits: createDictionary(),
        countriesVisitors: createDictionary(),
        deviceVisits: createDictionary(),
        deviceVisitors: createDictionary(),
        timeVisits: createDictionary(),
        timeVisitors: createDictionary(),
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
        if (!tagTotals.timeVisits[tag]) tagTotals.timeVisits[tag] = createDictionary();
        tagTotals.timeVisits[tag][visitData.timestamp] =
            (tagTotals.timeVisits[tag][visitData.timestamp] || 0) + 1;
        if (!tagTotals.timeVisitors[tag]) tagTotals.timeVisitors[tag] = createDictionary();
        if (!tagTotals.timeVisitors[tag][visitData.timestamp]) tagTotals.timeVisitors[tag][visitData.timestamp] = createDictionary();
        tagTotals.timeVisitors[tag][visitData.timestamp][visitId] =
            (tagTotals.timeVisitors[tag][visitData.timestamp][visitId] || 0) + 1;

        // country
        if (!tagTotals.countriesVisits[tag]) tagTotals.countriesVisits[tag] = createDictionary();
        if (!tagTotals.countriesVisitors[tag]) tagTotals.countriesVisitors[tag] = createDictionary();
        statsAddOne({
            typeName: visitData.code && Object.hasOwn(countriesCodes, visitData.code) ?
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
        if (!tagTotals.deviceVisitors[tag]) tagTotals.deviceVisitors[tag] = createDictionary();
        statsAddOne({
            typeName: deviceType,
            visitsObj: tagTotals.deviceVisits[tag],
            visitorsObj: tagTotals.deviceVisitors[tag],
            visitId
        });

        // totals
        tagTotals.eventTotals[tag] = (tagTotals.eventTotals[tag] || 0) + 1;
        if (!tagTotals.visitorsCount[tag]) tagTotals.visitorsCount[tag] = createDictionary();
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
            tagMetrics: StatsTagMetricSets = createDictionary();
        for (const tag in tagTotals.eventTotals) {
            const
                { chartVisits, chartVisitors } = chartSeries({
                    timeVisits: tagTotals.timeVisits[tag] || createDictionary(),
                    timeVisitors: tagTotals.timeVisitors[tag] || createDictionary(),
                    resolution,
                    days,
                    updateStartTime,
                });
            tagMetrics[tag] = {
                total: tagTotals.eventTotals[tag],
                countries: formatVisits({
                    visitors: tagTotals.countriesVisitors[tag] || createDictionary(),
                    visits: tagTotals.countriesVisits[tag] || createDictionary(),
                }),
                devices: formatVisits({
                    visitors: tagTotals.deviceVisitors[tag] || createDictionary(),
                    visits: tagTotals.deviceVisits[tag] || createDictionary(),
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
                visitorsCount: NumberObj = createDictionary(),
                freqVisitors: StatsFreqVisits = createDictionary(),
                countriesVisits: NumberObj = createDictionary(),
                countriesVisitors: NumberObjObj = createDictionary(),
                deviceVisits: StatsDeviceObj<number> = {
                    mobile: 0,
                    desktop: 0,
                },
                deviceVisitors: NumberObjObj = createDictionary(),
                timeVisitors: NumberObjObj = createDictionary(),
                timeVisits: NumberObj = createDictionary(),
                pageVisitors: NumberObjObj = createDictionary(),
                dayDataTarget: TrafficDataDay = createDictionary(),
                dayDataFiltered: TrafficDataDay = createDictionary(),
                spamVisitors: NumberObj = createDictionary(),
                spamTimestamps: NumberObj = {},
                dimAccumulator = (): DimAccumulator => ({ sumW: 0, sumH: 0, count: 0 }),
                durMeanAccumulator = (): DurMeanAccumulator => ({ sum: 0, count: 0 }),
                mobileDimAccum: { [pageName: string]: DimAccumulator } = createDictionary(),
                desktopDimAccum: { [pageName: string]: DimAccumulator } = createDictionary(),
                durMeanAccum: { [pageName: string]: DurMeanAccumulator } = createDictionary(),
                mobileAllAcc = dimAccumulator(),
                desktopAllAcc = dimAccumulator(),
                dimMean = (acc?: DimAccumulator): DeviceWidthHeight =>
                    acc?.count
                        ? [
                            Math.round((acc.sumW / acc.count) / 10) * 10,
                            Math.round((acc.sumH / acc.count) / 10) * 10,
                        ]
                        : [0, 0],
                dataObj: PageTrafficDataObj = createDictionary(),
                clicksAccumulator = tagAccumulator(),
                inviewsAccumulator = tagAccumulator(),
                allTimeVisits: NumberObj = {},
                allTimeVisitors: NumberObjObj = createDictionary();

            // chart resolution
            const
                days = dateReqStr?.split(`,`),
                daysCount = days?.length;

            resolution = clampNumber({
                value: resolution || (
                    daysCount == 1 ? 24
                        : daysCount == 7 ? 14
                            : daysCount
                ),
                minimum: 1,
                maximum: reportResolutionMax,
            });

            // build all-time counts
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
                    if (!allTimeVisitors[timestamp]) allTimeVisitors[timestamp] = createDictionary();
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

                if (!pageVisitors[pageName]) pageVisitors[pageName] = createDictionary();

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
                        if (!timeVisitors[timestamp]) timeVisitors[timestamp] = createDictionary();
                        timeVisitors[timestamp][visitId] =
                            (timeVisitors[timestamp]?.[visitId] || 0) + 1;
                    };

                    // per-tag interaction events
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
                        typeName: visitData.code && Object.hasOwn(countriesCodes, visitData.code) ?
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
                    const
                        winW = visitData.winW,
                        winH = visitData.winH;

                    if (
                        typeof winW == `number`
                        && isFinite(winW)
                        && typeof winH == `number`
                        && isFinite(winH)
                    ) {
                        const dimAccum = isMobile ? mobileDimAccum : desktopDimAccum;
                        if (!dimAccum[pageName]) dimAccum[pageName] = dimAccumulator();
                        dimAccum[pageName].sumW += winW;
                        dimAccum[pageName].sumH += winH;
                        dimAccum[pageName].count++;
                        const allAcc = isMobile ? mobileAllAcc : desktopAllAcc;
                        allAcc.sumW += winW;
                        allAcc.sumH += winH;
                        allAcc.count++;
                    };

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
                        if (!freqVisitors[visitId]) freqVisitors[visitId] = createDictionary();
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