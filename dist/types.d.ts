import { NumberObj } from "@degreesign/utils";
/** IPs list */
interface IPList {
    /**  ip pro list + counter */
    p: NumberObj;
    /**  ip cloud white list + counter */
    w: NumberObj;
    /**  ip black list */
    b: string[];
    /**  ip general list + counter */
    l: NumberObj;
}
/** IP Rate limits */
interface RateLimits {
    /** general user */
    generalAccess: number;
    /** white list */
    whiteListed: number;
    /** paid list */
    priorityAccess: number;
}
/** IP Country Range */
interface IPCountryRange {
    start_ip_num: string;
    end_ip_num: string;
    country: string;
}
/** Start IP Num, End IP Num, Country Code, [3758092288,3758093311,"HK"] */
type IPRange = [number, number, string];
interface IPData {
    /** IPs list */
    ipList: IPList;
    /** IP range */
    ipRange: IPRange[];
}
export { IPList, RateLimits, IPCountryRange, IPRange, IPData, };
