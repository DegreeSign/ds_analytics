import { randomUUID } from "node:crypto";
import { renameSync, unlinkSync, writeFileSync } from "node:fs";
import { seoDt } from "@degreesign/utils";

/** Atomic JSON write */
const writeJsonAtomic = <T>({
    filePath,
    data,
}: {
    filePath: string,
    data: T,
}) => {
    const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    try {
        const serialised = JSON.stringify(data);
        if (serialised === undefined) {
            console.log(seoDt(), `writeJsonAtomic failed`, filePath);
            return false;
        }
        writeFileSync(temporaryPath, serialised, {
            encoding: `utf8`,
            mode: 0o600,
        });
        renameSync(temporaryPath, filePath);
        return true;
    } catch (error) {
        console.log(seoDt(), `writeJsonAtomic failed`, error);
        try {
            unlinkSync(temporaryPath);
        } catch {
            // temp already removed
        }
        return false;
    }
};

export { writeJsonAtomic };
