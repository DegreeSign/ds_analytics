declare const ipUpdateIntervals: ({ rangeRefreshInterval, ipLimitResetInterval, }: {
    /** default is 24 hours */
    rangeRefreshInterval?: number;
    /** default is 5 mins */
    ipLimitResetInterval?: number;
}) => void;
export { ipUpdateIntervals };
