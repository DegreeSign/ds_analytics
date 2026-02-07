import { NumberObj } from "@degreesign/utils";
import { CountryCode } from "../code/constants";
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
/** IP Country Range */
interface IPCountryRange {
    start_ip_num: string;
    end_ip_num: string;
    country: string;
}
/** Start IP Num, End IP Num, Country Code, [3758092288,3758093311,"HK"] */
type IPRange = [number, number, CountryCode];
interface IPData {
    /** IPs list */
    ipList: IPList;
    /** IP range */
    ipRange: IPRange[];
}
interface IPConfig {
    /** default is 24 hours */
    ipRangeRefreshInterval?: number;
    /** default is 5 mins */
    ipLimitResetInterval?: number;
}
export { IPList, IPCountryRange, IPRange, IPData, IPConfig, };
