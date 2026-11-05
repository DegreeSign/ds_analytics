import { PageVisitPayload, StatsEventType } from "../types/stats";
import {
    controlCorrupt,
    keyCorrupt,
    referrerMaxLength,
    reservedKeys,
} from "./constants";

const
    /** Null-prototype dictionary */
    createDictionary = <T>() => Object.create(null) as T,
    /** Clamp numeric range */
    clampNumber = ({
        value,
        minimum,
        maximum,
    }: {
        value: number,
        minimum: number,
        maximum: number,
    }) =>
        isFinite(value)
            ? Math.min(Math.max(Math.floor(value), minimum), maximum)
            : value > 0 ? maximum : minimum,
    /** Optional bounded text */
    validText = ({
        text,
        maximum,
    }: {
        text?: string,
        maximum: number,
    }) =>
        text === undefined || (
            typeof text == `string`
            && text.length <= maximum
        ),
    /** Optional safe key */
    validKey = (key?: string) =>
        key === undefined || (
            !!key
            && !key.match(keyCorrupt)
            && !reservedKeys.includes(key)
        ),
    /** Optional absolute URL */
    validReferrer = (referrer?: string) => {
        if (referrer === undefined) return true
        if (
            typeof referrer != `string`
            || !validText({
                text: referrer,
                maximum: referrerMaxLength,
            })
            || referrer.match(controlCorrupt)
        ) return false
        try {
            const url = new URL(referrer);
            return url.protocol == `http:` || url.protocol == `https:`
        } catch {
            return false
        };
    },
    /** Optional finite number */
    validNumber = ({
        value,
        minimum = 0,
        maximum = Number.MAX_SAFE_INTEGER,
    }: {
        value?: number,
        minimum?: number,
        maximum?: number,
    }) =>
        value === undefined || (
            typeof value == `number`
            && isFinite(value)
            && value >= minimum
            && value <= maximum
        ),
    /** Optional event type */
    validEvent = (event?: StatsEventType) =>
        event === undefined || Object.values(StatsEventType).includes(event),
    /** Strict page visit payload shape */
    validPageVisitPayload = (data?: PageVisitPayload) =>
        !!data
        && typeof data.session == `string`
        && typeof data.statsId == `string`
        && typeof data.uri == `string`
        && Object.values(StatsEventType).includes(data.event)
        && typeof data.timestamp == `number`
        && isFinite(data.timestamp)
        && typeof data.winW == `number`
        && isFinite(data.winW)
        && typeof data.winH == `number`
        && isFinite(data.winH)
        && (data.dur === undefined || (
            typeof data.dur == `number`
            && isFinite(data.dur)
        ))
        && (data.logged === undefined || typeof data.logged == `boolean`)
        && (data.tag === undefined || typeof data.tag == `string`)
        && (data.referrer === undefined || typeof data.referrer == `string`)
        && (data.code === undefined || typeof data.code == `string`);

export {
    createDictionary,
    clampNumber,
    validText,
    validKey,
    validReferrer,
    validNumber,
    validEvent,
    validPageVisitPayload,
};
