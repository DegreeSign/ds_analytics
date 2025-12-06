declare const ipStart: ({ ipRangeRefreshInterval, ipLimitResetInterval, }: {
    /** default is 24 hours */
    ipRangeRefreshInterval?: number;
    /** default is 5 mins */
    ipLimitResetInterval?: number;
}) => Promise<void>;
export { ipStart, };
