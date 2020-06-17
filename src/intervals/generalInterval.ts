import { Interval } from "../types";
import { createIterator } from "../util";

export interface Comparable {
    equals: <T extends Comparable>(item: T) => boolean;
    isLessThan: <T extends Comparable>(item: T) => boolean;
}

export const createInterval = <T>(equals: (a: T, b: T) => boolean, isLessThan: (a: T, b: T) => boolean, infinity: any) => {
    const min = (a?: T, b?: T) => (!a || !b) ? getInfinity(a, b) : (isLessThan(a, b) ? a : b);
    const max = (a?: T, b?: T) => (!a || !b) ? getNotInfinity(a, b) : isLessThan(a, b) ? b : a;
    const less = (a?: T, b?: T) => (!a || !b) ? infinityIsMore(a, b, false) : isLessThan(a, b);
    const lessOrEqual = (a?: T, b?: T) => (!a || !b) ? infinityIsMore(b, a, true) : isLessThan(a, b) || equals(a, b);
    const more = (a?: T, b?: T) => (!a || !b) ? infinityIsMore(b, a, false) : isLessThan(b, a);
    const moreOrEqual = (a?: T, b?: T) => (!a || !b) ? infinityIsMore(b, a, true) : isLessThan(b, a) || equals(a, b);

    const getInfinity = (a: any, b: any) => a === infinity ? a : b;
    const getNotInfinity = (a: any, b: any) => a === infinity ? b : a;
    const infinityIsMore = (a: any, b: any, equal: boolean) => {
        if (a === b && equal) {
            return true;
        }
        if (a === infinity && b !== infinity) {
            return false; // a is more than b
        }
        return true;
    };

    const generalInterval = (start: T, end: T, next: (current: T) => T): Interval<T> => {
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
        interval.it = createIterator(interval, next, (a, b) => equals(a, b));
        interval.next = () => interval.it(1);
        interval.val = () => interval.current;
        interval.concat = nextInterval => {
            if (!interval.overlap(nextInterval)) {
                return [interval, nextInterval];
            }
            return [generalInterval(min(interval.start, nextInterval.start), max(interval.end, nextInterval.end), next)];
        };
        interval.has = value => value >= interval.start && less(value, interval.end);
        interval.diff = nextInterval => {
            if (!interval.overlap(nextInterval)) {
                return [interval];
            }
            if (lessOrEqual(interval.start, nextInterval.start) && lessOrEqual(interval.end, nextInterval.end)) {
                return [generalInterval(interval.start, nextInterval.end, interval.usedNext)];
            }
            if (moreOrEqual(interval.start, nextInterval.start) && moreOrEqual(interval.end, nextInterval.end)) {
                return [generalInterval(nextInterval.start, interval.end, interval.usedNext)];
            }
            if (interval.isInside(nextInterval)) {
                return [];
            }
            return [
                generalInterval(interval.start, nextInterval.start, interval.usedNext),
                generalInterval(interval.end, nextInterval.end, interval.usedNext),
            ];
        };
        interval.overlap = nextInterval => interval.has(nextInterval.start) || interval.has(nextInterval.end);
        interval.isInside = nextInterval => more(interval.start, nextInterval.start) && lessOrEqual(interval.end, nextInterval.end);
        interval.compare = nextInterval => interval.overlap(nextInterval) ? 0 : less(interval.start, nextInterval.start) ? -1 : 1;
        interval.copy = () => generalInterval(interval.start, interval.end, interval.usedNext);
        interval.array = () => {
            if (interval.end === infinity) {
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

    return generalInterval;
};
