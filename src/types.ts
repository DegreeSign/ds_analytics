import { NumberObj } from "@degreesign/utils";

interface IPList { // ip lists
    /**  ip pro list + counter */
    p: NumberObj,
    /**  ip cloud white list + counter */
    w: NumberObj,
    /**  ip black list */
    b: string[],
    /**  ip general list + counter */
    l: NumberObj,
}

interface RateLimits {
    /** general user */
    general: number;
    /** white list */
    white: number;
    /** paid list */
    paid: number;
}

interface IPCountryRow {
    start_ip_num: string;
    end_ip_num: string;
    country: string;
}

/** Start IP Num, End IP Num, Country Code */
type IPRange = [number, number, string];

export {
    IPList,
    RateLimits,
    IPCountryRow,
    IPRange,
}