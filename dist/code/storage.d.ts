/** Atomic JSON write */
declare const writeJsonAtomic: <T>({ filePath, data, }: {
    filePath: string;
    data: T;
}) => boolean;
export { writeJsonAtomic };
