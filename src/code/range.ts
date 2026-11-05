import { seoDt } from "@degreesign/utils";
import { IPRange } from "../types/ip";
import { CountryCode, ipSourceUrl } from "./constants";
import { ipRangeSort, ipRangesMax, validIPRange } from "./analyse";

let
    /** Download in flight */
    ipRangeInFlight = false;

const
    /** Download timeout */
    ipRangeTimeout = 30e3,
    /** Download byte limit */
    ipRangeBytesMax = 16 * 1024 * 1024,
    /** Parse one CSV line */
    ipRangeParse = (line: string): IPRange | undefined => {
        const [startText, endText, countryText] = line.split(`,`);
        if (!startText?.trim() || !endText?.trim() || !countryText?.trim()) return;
        const
            startNum = Number(startText),
            endNum = Number(endText),
            country = countryText.trim() as CountryCode;
        if (!validIPRange({ startNum, endNum, country })) return;
        return [startNum, endNum, country];
    },
    /** Append parsed lines */
    ipRangeAppend = ({ ipRanges, lines }: { ipRanges: IPRange[], lines: string[] }) => {
        for (let i = 0; i < lines.length; i++) {
            const range = ipRangeParse(lines[i]);
            if (!range) continue;
            if (ipRanges.length >= ipRangesMax) return false;
            ipRanges.push(range);
        };
        return true;
    },
    /** Range limit exceeded */
    ipRangeOverflow = (): IPRange[] => {
        console.log(seoDt(), `ipCountryDataUpdate ranges overflow`);
        return [];
    },
    ipCountryDataUpdate = async (): Promise<IPRange[]> => {
        if (ipRangeInFlight) return [];
        ipRangeInFlight = true;
        try {
            const response = await fetch(ipSourceUrl, { signal: AbortSignal.timeout(ipRangeTimeout) });
            if (!response.ok || !response.body) {
                console.log(seoDt(), `ipCountryDataUpdate response failed`);
                return [];
            };

            const
                reader = response.body.getReader(),
                decoder = new TextDecoder(),
                ipRanges: IPRange[] = [];
            let
                buffer = ``,
                bytesRead = 0;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    bytesRead += value?.length || 0;
                    if (bytesRead > ipRangeBytesMax) {
                        console.log(seoDt(), `ipCountryDataUpdate download overflow`);
                        return [];
                    };

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split(`\n`);
                    buffer = lines.pop() || ``;

                    if (!ipRangeAppend({ ipRanges, lines })) return ipRangeOverflow();
                };
            } finally {
                await reader.cancel().catch(() => undefined);
                reader.releaseLock();
            };

            buffer += decoder.decode();
            if (!ipRangeAppend({ ipRanges, lines: buffer.split(`\n`) })) return ipRangeOverflow();

            if (!ipRanges?.length) {
                console.log(seoDt(), `ipCountryDataUpdate no data`);
                return [];
            };
            return ipRangeSort(ipRanges);

        } catch (e) {
            console.log(seoDt(), `ipCountryDataUpdate failed`, e);
            return [];
        } finally {
            ipRangeInFlight = false;
        };
    };

export {
    ipCountryDataUpdate,
}
