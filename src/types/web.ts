import { PageVisitPayload } from "./stats";

/** Web Config */
interface WebConfig {
    /** Web Record Interval */
    checkInterval?: number;
}

/** final = dismissal send; use sendBeacon */
type RecordCallback = (data: PageVisitPayload, final?: boolean) => any;

export {
    WebConfig,
    RecordCallback,
}