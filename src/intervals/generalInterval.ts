import { Interval } from "../types";

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
    const equalWithInfinity = (a?: T, b?: T) => (!a || !b) ? a === b : equals(a, b);
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

    const createIterator = (interval: Interval<T>, next: (iterator: T) => T) => (iterator: number) => {
        if (iterator <= 0) {
            return interval;
        }
        if (!equals(interval.end, interval.current)) {
            const nextValue = next(interval.current);
            if (less(interval.end, nextValue)) {
                return interval;
            } 
            interval.current = nextValue;
            return interval.it(iterator--);
        }
        return interval; 
    };
    
    const concatNext = (...interval: Array<Interval<T>>): ((current: T) => T) => (current: T) => {
        const owner = interval.find(i => i.has(current));
        if (!owner) {
            return current;
        }
        return owner.usedNext(current);
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
        interval.it = createIterator(interval, next);
        interval.next = () => interval.it(1);
        interval.val = () => interval.current;
        interval.concat = nextInterval => {
            if (!interval.overlap(nextInterval)) {
                return [interval, nextInterval];
            }
            return [generalInterval(min(interval.start, nextInterval.start), max(interval.end, nextInterval.end), concatNext(interval, nextInterval))];
        };
        interval.has = value => moreOrEqual(value, interval.start) && less(value, interval.end);
        interval.diff = nextInterval => {
            if (!interval.overlap(nextInterval)) {
                return [interval];
            }
            if (lessOrEqual(interval.start, nextInterval.start) && lessOrEqual(interval.end, nextInterval.end)) {
                return [generalInterval(interval.start, nextInterval.end, concatNext(interval, nextInterval))];
            }
            if (moreOrEqual(interval.start, nextInterval.start) && moreOrEqual(interval.end, nextInterval.end)) {
                return [generalInterval(nextInterval.start, interval.end, concatNext(interval, nextInterval))];
            }
            if (interval.isInside(nextInterval)) {
                return [];
            }
            return [
                generalInterval(interval.start, nextInterval.start, interval.usedNext),
                generalInterval(interval.end, nextInterval.end, nextInterval.usedNext),
            ];
        };
        interval.overlap = nextInterval => interval.has(nextInterval.start) || interval.has(nextInterval.end);
        interval.isInside = nextInterval => more(interval.start, nextInterval.start) && lessOrEqual(interval.end, nextInterval.end);
        interval.compare = nextInterval => interval.overlap(nextInterval) ? 0 : less(interval.start, nextInterval.start) ? -1 : 1;
        interval.copy = () => generalInterval(interval.start, interval.end, interval.usedNext);
        interval.fillIn = intervals => {
            if (!intervals || intervals.length === 0) {
                return interval;
            }
            let filler = intervals[0];
            for (let i = 0; i < intervals.length; i++) {
                const at = intervals[i];
                if (moreOrEqual(filler.end, at.start)) {
                    filler = filler.concat(at)[0];
                } else {
                    filler = filler.concat(interval(filler.end, at.start, interval.usedNext).concat(at)[0])[0]
                }
            }
            return filler;
        }
        interval.sort = intervals => [...intervals].sort((a, b) => a.compare(b))
        interval.array = () => {
            if (interval.end === infinity) {
                throw Error('Cannot count to Infinity!');
            }
            const aggregate: T[] = [interval.val()];
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
