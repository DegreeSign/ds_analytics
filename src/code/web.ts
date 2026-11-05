import { idRandShort, oneMon, oneSec, rNum, tN } from "@degreesign/utils";
import { PageVisitInitiation, PageVisitPayload, RecordEventInteractionInput, RecordEventPageViewInput, StatsEventType } from "../types/stats";
import { CountryCode, checkInterval, checkIntervalMax, countriesCodes, statsIdMaxLength, webConfig, unknownCountryCode } from "./constants";
import { validKey, validText } from "./validation";
import { RecordCallback, WebConfig } from "../types/web";

let
    webAnalyticsStarted = false,
    webAnalyticsController: AbortController | undefined,
    webAnalyticsHeartbeat: ReturnType<typeof setTimeout> | undefined;

const
    /** Set Web Configurations */
    setWebConfig = (config: WebConfig) => {
        const newCheckInterval = config.checkInterval;
        if (typeof newCheckInterval == `number` && isFinite(newCheckInterval))
            webConfig.checkInterval = Math.min(Math.max(newCheckInterval, oneSec), checkIntervalMax);
    },
    /** Get Country Code */
    getCountryCode = (): CountryCode => {
        try {
            const
                userLanguage: string = navigator.language || navigator.languages?.[0],
                countryCode = userLanguage?.split(`-`)?.[1]?.toUpperCase() as CountryCode;
            return Object.hasOwn(countriesCodes, countryCode) ? countryCode : unknownCountryCode
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
                    if (
                        validText({
                            text: statsId,
                            maximum: statsIdMaxLength,
                        })
                        && validKey(statsId)
                        && typeof time == `number`
                        && isFinite(time)
                        && time > (tN() - oneMon)
                        && time <= tN()
                    )
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
        record: RecordCallback
    }) => {
        /** Run once only */
        if (webAnalyticsStarted) return;
        webAnalyticsStarted = true;
        try {
            webAnalyticsController = new AbortController();
            const { signal } = webAnalyticsController;

            let
                updateInterval = webConfig.checkInterval || checkInterval,
                maxUpdateInterval = Math.max(checkIntervalMax, updateInterval),
                hiddenTime = 0,
                isHidden = false,
                dismissed = false,
                lastVisibleTime = tN();

            const
                data = webData(logged),
                update = (newPage: boolean, final?: boolean) => {
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
                        record(data, final);

                        // no back-off for dismissal sends
                        if (!final)
                            updateInterval = Math.min(updateInterval * 2, maxUpdateInterval);

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
                },
                /** self-rescheduling heartbeat (parked while hidden) */
                scheduleUpdate = () => {
                    clearTimeout(webAnalyticsHeartbeat);
                    if (isHidden || dismissed) return;
                    webAnalyticsHeartbeat = setTimeout(() => {
                        update(false);
                        scheduleUpdate();
                    }, updateInterval);
                },
                /** one-shot dismissal send */
                sendFinal = () => {
                    if (dismissed) return;
                    dismissed = true;
                    clearTimeout(webAnalyticsHeartbeat);
                    // credit the final hidden stretch so dur excludes background time
                    if (isHidden) hiddenTime += (tN() - lastVisibleTime);
                    update(false, true);
                    // stop listeners after send
                    webAnalyticsController?.abort();
                };

            // track hidden time (excludes background time from duration)
            document.addEventListener(`visibilitychange`, () => {
                if (document.visibilityState == `visible`) {
                    if (!isHidden) return;
                    isHidden = false;
                    hiddenTime += (tN() - lastVisibleTime);
                    scheduleUpdate();
                } else {
                    if (isHidden) return;
                    isHidden = true;
                    lastVisibleTime = tN();
                    // park the heartbeat, hiddenTime is only credited on return
                    scheduleUpdate();
                };
            }, { signal });

            // bfcache freeze is a pause, not a dismissal; only real dismissals send final
            window.addEventListener(`pagehide`, (event) => {
                if (event?.persisted) {
                    if (!isHidden) {
                        isHidden = true;
                        lastVisibleTime = tN();
                    };
                    clearTimeout(webAnalyticsHeartbeat);
                } else {
                    sendFinal();
                };
            }, { signal });

            // bfcache restore (pagehide can fire with no visibilitychange)
            window.addEventListener(`pageshow`, (event) => {
                if (!event?.persisted) return;
                if (isHidden) {
                    isHidden = false;
                    hiddenTime += (tN() - lastVisibleTime);
                };
                scheduleUpdate();
            }, { signal });

            try {
                // @ts-ignore
                navigation.addEventListener(`navigatesuccess`, () => {
                    update(false);
                    scheduleUpdate();
                }, { signal });
            } catch (e) { };

            // initiate
            record(data);

            // periodic update, backing off
            scheduleUpdate();
        } catch (e) {
            clearTimeout(webAnalyticsHeartbeat);
            webAnalyticsHeartbeat = undefined;
            webAnalyticsController?.abort();
            webAnalyticsController = undefined;
            webAnalyticsStarted = false;
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