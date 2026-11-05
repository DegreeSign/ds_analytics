import { PageVisitPayload, StatsEventType } from "../types/stats";
declare const 
/** Null-prototype dictionary */
createDictionary: <T>() => T, 
/** Clamp numeric range */
clampNumber: ({ value, minimum, maximum, }: {
    value: number;
    minimum: number;
    maximum: number;
}) => number, 
/** Optional bounded text */
validText: ({ text, maximum, }: {
    text?: string;
    maximum: number;
}) => boolean, 
/** Optional safe key */
validKey: (key?: string) => boolean, 
/** Optional absolute URL */
validReferrer: (referrer?: string) => boolean, 
/** Optional finite number */
validNumber: ({ value, minimum, maximum, }: {
    value?: number;
    minimum?: number;
    maximum?: number;
}) => boolean, 
/** Optional event type */
validEvent: (event?: StatsEventType) => boolean, 
/** Strict page visit payload shape */
validPageVisitPayload: (data?: PageVisitPayload) => boolean;
export { createDictionary, clampNumber, validText, validKey, validReferrer, validNumber, validEvent, validPageVisitPayload, };
