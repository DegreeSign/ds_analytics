import { IPRange } from "../types";
import { ipSourceUrl } from "./constants";

const
    ipCountryDataUpdate = async (): Promise<IPRange[]> => await new Promise(async resolve => {
        try {
            const
                response = await fetch(ipSourceUrl),
                reader = response?.body!.getReader(),
                decoder = new TextDecoder(),
                ipRanges: IPRange[] = [];
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;
                    const
                        [start_ip_num, end_ip_num, country] = line.split(","),
                        startNum = parseInt(start_ip_num),
                        endNum = parseInt(end_ip_num);
                    if (startNum && country) {
                        ipRanges.push([startNum, endNum, country.trim()]);
                    };
                };
            };

            if (!ipRanges?.length)
                console.log(`ipCountryDataUpdate no data`);
            else resolve(ipRanges);

        } catch (e) {
            console.log(`ipCountryDataUpdate failed`, e);
            resolve([]);
        };
    });

export {
    ipCountryDataUpdate,
}