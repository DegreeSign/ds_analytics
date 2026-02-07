import { PageVisitPayload } from "../types/stats";
import { WebConfig } from "../types/web";
declare const 
/** Set Web Configurations */
setWebConfig: (config: WebConfig) => void, 
/** web analytics (browser) */
webAnalytics: ({ logged, record, }: {
    logged?: boolean;
    record: (data: PageVisitPayload) => any;
}) => void;
export { setWebConfig, webAnalytics, };
