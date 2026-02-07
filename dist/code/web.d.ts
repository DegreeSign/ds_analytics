import { PageVisitPayload } from "../types/stats";
import { CountryCode } from "./constants";
import { WebConfig } from "../types/web";
declare const 
/** Set Web Configurations */
setWebConfig: (config: WebConfig) => void, 
/** Get Country Code */
getCountryCode: () => CountryCode, 
/** web analytics (browser) */
webAnalytics: ({ logged, record, }: {
    logged?: boolean;
    record: (data: PageVisitPayload) => any;
}) => void;
export { setWebConfig, webAnalytics, getCountryCode, };
