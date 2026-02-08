import {
    getSum,
    getMean,
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
    PageDeviceDimensions,
    PageTrafficDataFinal,
    PageTrafficDataObj,
    StatsDevice,
    StatsDeviceObj,
    StatsReqParams,
    VisitorVisitsType,
    PageVisitPayload,
    StatsAnalysisResult,
    TrafficData,
    TrafficDataDay,
} from "../types/stats";
import { IPRange } from "../types/ip";
import { ipCountryCode } from "./analyse";
import { CountryCode, StatsConfig, countriesCodes, statsConfig, uriCorrupt } from "./constants";

const
    trafficData: TrafficData = {},
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
        } catch (e) { console.log(seoDt(), `saveStats failed`, e); };
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
                visitIndex = dur && visits?.length ?
                    visits?.findIndex(visit => visit.session == session)
                    : undefined;
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
                });
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
                for (const p in d)
                    traffic[p] = (
                        traffic[p] || []
                    ).concat(
                        d[p] || []
                    );
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
                traffic = combineStats([
                    todayDate, // today
                    yesterdayDate, // yesterday
                    dateStandard(prvCutOff), // preceding day
                ]),
                trafficToday: TrafficDataDay = {},
                trafficYesterday: TrafficDataDay = {};

            for (const page in traffic) {
                const visits = traffic[page];
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
                    ) || `UN`,
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
                totalVisitsBounced = 0;

            const
                totalDur: number[] = [],
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
                chartVisitors: number[] = [],
                chartVisits: number[] = [],
                spamVisitors: NumberObj = {},
                spamTimestamps: NumberObj = {},
                mobileDim: PageDeviceDimensions = {},
                desktopDim: PageDeviceDimensions = {},
                dataObj: PageTrafficDataObj = {};

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
                    timeVisits[timestamp] =
                        (timeVisits[timestamp] || 0) + 1;
                    if (!timeVisitors[timestamp]) timeVisitors[timestamp] = {};
                    timeVisitors[timestamp][visitData.statsId] =
                        (timeVisitors[timestamp]?.[visitData.statsId] || 0) + 1;
                };
            };

            // identify spam
            for (const timestamp in timeVisits) {
                const visitors = timeVisitors[timestamp];

                // visitors spam
                for (const visitId in visitors) {
                    const visits = visitors[visitId];
                    if (visits > spamVisitorLimit) {
                        timeVisits[timestamp] -= visits; // remove spam visits
                        delete visitors[visitId] // remove spam visitor
                        spamVisitors[visitId] = visits; // record spam visitor
                    };
                };

                // visits spam
                if (timeVisits[timestamp] > spamVisitsLimit) {
                    spamTimestamps[timestamp] = timeVisits[timestamp];
                    delete timeVisits[timestamp];
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

            const
                msInterval = (days?.length * oneDay) / resolution,
                timestampList = Object.keys(timeVisits)
                    ?.map(n => +n)
                    ?.sort((a, b) => a > b ? 1 : -1),
                timeStart = updateStartTime ? timestampList[0]
                    : new Date(days[days.length - 1]).getTime();

            for (let i = 0; i < resolution; i++) {
                const
                    start = timeStart + msInterval * i,
                    startTimeIndex = timestampList.findIndex(t => t >= start),
                    end = timeStart + msInterval * (i + 1),
                    endTimeIndexRaw = timestampList.findIndex(t => t >= end),
                    endTimeIndex = endTimeIndexRaw == -1
                        && startTimeIndex != -1 ?
                        (timestampList.length - 1)
                        : endTimeIndexRaw;
                chartVisits[i] = chartVisits[i] || 0;
                chartVisitors[i] = chartVisitors[i] || 0;
                for (let t = startTimeIndex; t <= endTimeIndex; t++) {
                    const
                        timestamp = timestampList[t],
                        visits = timeVisits[timestamp];
                    chartVisits[i] += visits || 0;
                    chartVisitors[i] += objLen(timeVisitors[timestamp]);
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
                    desktopVisits = 0;

                const
                    durV: number[] = [],
                    pageName = uri == `/` ? `Home`
                        : getURIAlias(uri),
                    visits = dayDataTarget[uri],
                    visitsFiltered = visits.filter(v => !(
                        spamVisitors[v.statsId]
                        || spamTimestamps[v.timestamp]
                    ));

                dayDataFiltered[uri] = visitsFiltered;

                if (!mobileDim[pageName]?.length) mobileDim[pageName] = [];
                if (!desktopDim[pageName]?.length) desktopDim[pageName] = [];
                if (!pageVisitors[pageName]) pageVisitors[pageName] = {};

                // process page visits
                for (let i = 0; i < visitsFiltered.length; i++) {

                    const
                        visitData = visitsFiltered[i],
                        visitId = visitData.statsId,
                        deviceType = visitData.winW < 900 ? StatsDevice.mobile : StatsDevice.desktop,
                        isMobile = deviceType == StatsDevice.mobile;

                    // country
                    statsAddOne({
                        typeName: visitData.code && countriesCodes[visitData.code] ?
                            visitData.code : `UN`,
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
                    (isMobile ? mobileDim : desktopDim)[pageName].push([visitData.winW, visitData.winH]);

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
                    totalDur.push(duration);
                    durV.push(duration);

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
                if (!dataObj[pageName]) dataObj[pageName] = {
                    visits: 0,
                    visitsBounced: 0,
                    dur: 0,
                    durArray: [],
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
                dataObj[pageName].dur += getSum(durV);
                dataObj[pageName].durArray = (dataObj[pageName].durArray || []).concat(durV);
                dataObj[pageName].search += searchRefValue;
                dataObj[pageName].domain += thisDomainRefValue;
                dataObj[pageName].other += otherRefV;
                dataObj[pageName].devices.mobile += mobileVisits;
                dataObj[pageName].devices.desktop += desktopVisits;
            };

            // page visitors
            const
                mobileWidthAll: DeviceWidthHeight[] = [],
                desktopWidthAll: DeviceWidthHeight[] = [],
                dimMean = (array: DeviceWidthHeight[]): DeviceWidthHeight => {
                    const
                        meanWidth = getMean(array.map(([w,]) => w)),
                        meanHeight = getMean(array.map(([, h]) => h));
                    return [
                        Math.round(meanWidth / 10) * 10,
                        Math.round(meanHeight / 10) * 10
                    ]
                };
            for (const pageName in dataObj) {
                const
                    mobilePageDim = mobileDim[pageName],
                    desktopPageDim = desktopDim[pageName];
                dataObj[pageName].users = objLen(pageVisitors[pageName]);
                dataObj[pageName].devicesDim = {
                    mobile: dimMean(mobilePageDim),
                    desktop: dimMean(desktopPageDim),
                };

                // all width
                mobileWidthAll.push(...mobilePageDim);
                desktopWidthAll.push(...desktopPageDim);
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
                dur: getSum(totalDur),
                durArray: totalDur,
                users: totalVisitors,
                devices: deviceVisits,
                devicesDim: {
                    mobile: dimMean(mobileWidthAll),
                    desktop: dimMean(desktopWidthAll)
                },
            }]);

            // finalise page
            const pagesListFinal: [string, PageTrafficDataFinal][] = [];
            for (let i = 0; i < pagesList.length; i++) {
                const
                    [page, data] = pagesList[i],
                    filtered = data.durArray?.filter(t => visitMinSeconds < t && t < visitCutOffSeconds),
                    newData: PageTrafficDataFinal = {
                        ...data,
                        // mean time filter
                        durMean: getMean(filtered),
                        verifiedVisits: filtered?.length,
                    };
                delete newData.durArray;
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