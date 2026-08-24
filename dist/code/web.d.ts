import { PageVisitPayload, RecordEventInteractionInput, RecordEventPageViewInput } from "../types/stats";
import { CountryCode } from "./constants";
import { WebConfig } from "../types/web";
declare const 
/** Set Web Configurations */
setWebConfig: (config: WebConfig) => void, 
/** Get Country Code */
getCountryCode: () => CountryCode, 
/** web data */
/** @deprecated Use `recordEvent` instead */
webData: (logged?: boolean) => PageVisitPayload, 
/** interaction event (click / inview) */
recordEvent: (input: RecordEventPageViewInput | RecordEventInteractionInput) => PageVisitPayload, 
/** web analytics (browser) */
webAnalytics: ({ logged, record, }: {
    logged?: boolean;
    record: (data: PageVisitPayload) => any;
}) => void;
export { setWebConfig, webData, recordEvent, webAnalytics, getCountryCode, };
