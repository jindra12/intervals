import { Interval } from "./types";

export const createIterator = <T>(interval: Interval<T>, next: (iterator: T) => T, equals: (a: T, b: T) => boolean) => (iterator: number) => {
    if (iterator <= 0) {
        return interval;
    }
    if (!equals(interval.end, interval.current)) {
        interval.current = next(interval.current);
        return interval.it(iterator--);
    }
    return interval; 
};