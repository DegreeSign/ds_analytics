import { idRandShort, oneMon, rNum, tN } from "@degreesign/utils";
import { PageVisitInitiation, PageVisitPayload, RecordEventInteractionInput, RecordEventPageViewInput, StatsEventType } from "../types/stats";
import { CountryCode, checkInterval, countriesCodes, webConfig, unknownCountryCode } from "./constants";
import { WebConfig } from "../types/web";

const
    /** Set Web Configurations */
    setWebConfig = (config: WebConfig) => {
        webConfig.checkInterval = config.checkInterval || webConfig.checkInterval;
    },
    /** Get Country Code */
    getCountryCode = (): CountryCode => {
        try {
            const
                userLanguage: string = navigator.language || navigator.languages?.[0],
                countryCode = userLanguage?.split(`-`)?.[1]?.toUpperCase() as CountryCode;
            return countriesCodes[countryCode] ? countryCode : unknownCountryCode
        } catch (e) {
            console.log(`getCountryCode failed`, e)
            return unknownCountryCode
        };
    },
    /** Temp Stats Id */
    tempStatsId = () => {
        try {

            let statsIdNew = ``;

            // verify current statsId
            if (localStorage?.statsId) {
                try {
                    const {
                        statsId,
                        time,
                    } = JSON.parse(localStorage?.statsId) || {};
                    if (statsId && time && time > (tN() - oneMon))
                        statsIdNew = statsId
                } catch (e) { };
            };

            // gen new statsId
            if (!statsIdNew) {
                statsIdNew = idRandShort(20);
                (localStorage || {}).statsId = JSON.stringify({
                    statsId: statsIdNew,
                    time: tN(),
                });
            };

            return statsIdNew
        } catch (e) {
            console.log(`tempStatsId failed`, e);
            return ``
        };
    },
    getPathName = () => {
        try {
            return window?.location?.pathname;
        } catch (e) {
            console.log(`getPathName failed`, e);
        };
        return ``
    },
    statsBasics = (
        logged?: boolean
    ): PageVisitInitiation => {
        const
            timestamp = tN(),
            session = idRandShort(15),
            uri = getPathName();
        return {
            session,
            timestamp,
            uri,
            logged,
        };
    },
    getReferrer = () => {
        try {
            return document?.referrer
        } catch (e) {
            console.log(`getReferrer failed`, e);
        };
        return ``
    },
    /** web data */
    /** @deprecated Use `recordEvent` instead */
    webData = (logged?: boolean): PageVisitPayload => {
        const
            referrer = getReferrer(),
            data: PageVisitPayload = {
                statsId: tempStatsId(),
                ...statsBasics(logged),
                event: StatsEventType.pageview,
                winW: window?.innerWidth,
                winH: window?.innerHeight,
                ...referrer ? { referrer } : {},
                code: getCountryCode(),
            };
        return data
    },
    /** interaction event (click / inview) */
    recordEvent = (input: RecordEventPageViewInput | RecordEventInteractionInput): PageVisitPayload => {
        const data = webData(input.logged);
        data.event = input.eventType;
        if (input.uriOverride) data.uri = input.uriOverride;
        if (input.eventType != StatsEventType.pageview) data.tag = input.tag;
        return data
    },
    /** web analytics (browser) */
    webAnalytics = ({
        logged,
        record,
    }: {
        logged?: boolean;
        record: (data: PageVisitPayload) => any
    }) => {
        try {

            let
                updateInterval = webConfig.checkInterval || checkInterval,
                hiddenTime = 0,
                isHidden = false,
                lastVisibleTime = tN();

            const
                data = webData(logged),
                update = (newPage: boolean) => {
                    try {
                        const
                            endTime = tN(),
                            totalDuration = Math.max(0, endTime - data.timestamp - hiddenTime),
                            durSeconds = rNum(totalDuration / 1e3, 3),
                            uri = window?.location?.pathname,
                            refresh = (
                                newPage
                                || data.uri != uri
                            );

                        // record updated time
                        data.dur = durSeconds;
                        record(data);
                        updateInterval = updateInterval * 2;

                        // reset stats (for new page)
                        if (refresh) {
                            const basics = statsBasics();
                            data.session = basics.session;
                            data.timestamp = basics.timestamp;
                            data.uri = basics.uri;
                            delete data.dur;
                            hiddenTime = 0;
                            updateInterval = webConfig.checkInterval || checkInterval;
                        };
                    } catch (e) {
                        console.log(`Analytics end error`, e);
                    };
                };

            // initiate
            record(data);

            // record on closure
            window.onbeforeunload = () => update(true);

            // 5 seconds update
            setInterval(() => {
                update(false);
            }, updateInterval);

            // calc hiddenTime
            document.onvisibilitychange = () => {
                if (document.visibilityState == `visible`) {
                    if (!isHidden) return;
                    isHidden = false;
                    hiddenTime += (tN() - lastVisibleTime);
                } else {
                    if (isHidden) return;
                    isHidden = true;
                    lastVisibleTime = tN();
                };
            };

            try {
                // @ts-ignore
                navigation.onnavigatesuccess = () => update(false);
            } catch (e) { };
        } catch (e) {
            console.log(`webAnalytics failed`, e);
        };
    };

export {
    setWebConfig,
    webData,
    recordEvent,
    webAnalytics,
    getCountryCode,
};