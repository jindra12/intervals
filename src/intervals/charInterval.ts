import { Interval } from "../types";
import { createIterator } from "../util";

const charMin = (a: string, b: string) => a > b ? b : a;
const charMax = (a: string, b: string) => a < b ? b : a;

export const charInterval = (start: string, end: string, next: (current: string) => string): Interval<string> => {
    const interval: Interval<string> = (start: string, end?: string, next?: (iterator: string) => string) => {
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
        return [charInterval(charMin(interval.start, nextInterval.start), charMax(interval.end, nextInterval.end), next)];
    };
    interval.has = value => value >= interval.start && value < interval.end;
    interval.diff = nextInterval => {
        if (!interval.overlap(nextInterval)) {
            return [interval];
        }
        if (interval.start <= nextInterval.start && interval.end <= nextInterval.end) {
            return [charInterval(interval.start, nextInterval.end, interval.usedNext)];
        }
        if (interval.start >= nextInterval.start && interval.end >= nextInterval.end) {
            return [charInterval(nextInterval.start, interval.end, interval.usedNext)];
        }
        if (interval.isInside(nextInterval)) {
            return [];
        }
        return [
            charInterval(interval.start, nextInterval.start, interval.usedNext),
            charInterval(interval.end, nextInterval.end, interval.usedNext),
        ];
    };
    interval.overlap = nextInterval => interval.has(nextInterval.start) || interval.has(nextInterval.end);
    interval.isInside = nextInterval => interval.start > nextInterval.start && interval.end <= nextInterval.end;
    interval.compare = nextInterval => interval.overlap(nextInterval) ? 0 : (interval.start < nextInterval.start) ? -1 : 1;
    interval.copy = () => charInterval(interval.start, interval.end, interval.usedNext);
    interval.array = () => {
        if (!interval.end) {
            throw Error('Cannot count to Infinity!');
        }
        const aggregate: string[] = [];
        const copyInterval = interval.copy();
        while (copyInterval.current !== copyInterval.end) {
            copyInterval.next();
            aggregate.push(copyInterval.val());
        }
        return aggregate;
    };
    return interval;
};