import { IPConfig } from "../types/ip";
declare const ipStart: ({ ipRangeRefreshInterval, ipLimitResetInterval, }: IPConfig) => Promise<void>;
export { ipStart, };
