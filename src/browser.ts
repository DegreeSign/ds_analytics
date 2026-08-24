import { setWebConfig, webAnalytics, getCountryCode, webData, recordEvent } from "./code/web";
import { RecordEventInteractionInput, RecordEventPageViewInput, StatsDevice, StatsEventType } from "./types/stats";
import { WebConfig } from "./types/web";

export {
    WebConfig,
    RecordEventPageViewInput,
    RecordEventInteractionInput,
    StatsDevice,
    StatsEventType,
    setWebConfig,
    webData,
    recordEvent,
    webAnalytics,
    getCountryCode,
}