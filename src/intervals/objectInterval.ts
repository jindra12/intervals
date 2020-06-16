import { Interval } from "../types";
import { createIterator } from "../util";

export const objectInterval = <T>(start: T, end: T, next: (current: T) => T): Interval<T> => {
    const interval: Interval<T> = (start: T, end?: T, next?: (iterator: T) => T) => {
        if (!start) {
            return interval;
        }
        interval.start = start;
        interval.current = start;
        if (end) {
            interval.end = end;
        }
        if (next) {
            interval.usedNext = next;
        }
        return interval;
    };
    interval.usedNext = next;
    interval.start = start;
    interval.current = start;
    interval.end = end;
    interval.it = createIterator(interval, next);
    interval.next = () => interval.it(1);
    interval.val = () => interval.current;
    interval.concat = nextInterval => {
        if (!interval.overlap(nextInterval)) {
            return [interval, nextInterval];
        }
        return [objectInterval(Math.min(interval.start, nextInterval.start), Math.max(interval.end, nextInterval.end), next)];
    };
    interval.has = value => value >= interval.start && value < interval.end;
    interval.diff = nextInterval => {
        if (!interval.overlap(nextInterval)) {
            return [interval];
        }
        if (interval.start <= nextInterval.start && interval.end <= nextInterval.end) {
            return [objectInterval(interval.start, nextInterval.end, interval.usedNext)];
        }
        if (interval.start >= nextInterval.start && interval.end >= nextInterval.end) {
            return [objectInterval(nextInterval.start, interval.end, interval.usedNext)];
        }
        if (interval.isInside(nextInterval)) {
            return [];
        }
        return [
            objectInterval(interval.start, nextInterval.start, interval.usedNext),
            objectInterval(interval.end, nextInterval.end, interval.usedNext),
        ];
    };
    interval.overlap = nextInterval => interval.has(nextInterval.start) || interval.has(nextInterval.end);
    interval.isInside = nextInterval => interval.start > nextInterval.start && interval.end <= nextInterval.end;
    interval.compare = nextInterval => interval.overlap(nextInterval) ? 0 : (interval.start < nextInterval.start) ? -1 : 1;
    interval.copy = () => objectInterval(interval.start, interval.end, interval.usedNext);
    interval.array = () => {
        if (!interval.end) {
            throw Error('Cannot count to Infinity!');
        }
        const aggregate: T[] = [];
        const copyInterval = interval.copy();
        while (copyInterval.current !== copyInterval.end) {
            copyInterval.next();
            aggregate.push(copyInterval.val());
        }
        return aggregate;
    };
    return interval;
};