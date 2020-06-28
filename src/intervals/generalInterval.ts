import { Interval, AllowedTypes } from "../types";
import intervalCreator from "../index";

export const createInterval = <T>(equals: (a: T, b: T) => boolean, isLessThan: (a: T, b: T) => boolean, infinity: any) => {
    const min = (a: T, b: T) => hasInfinity(a, b) ? getInfinity(a, b) : (isLessThan(a, b) ? a : b);
    const max = (a: T, b: T) => hasInfinity(a, b) ? getNotInfinity(a, b) : isLessThan(a, b) ? b : a;
    const less = (a: T, b: T) => hasInfinity(a, b) ? infinityIsMore(a, b, false) : isLessThan(a, b);
    const lessOrEqual = (a: T, b: T) => hasInfinity(a, b) ? infinityIsMore(a, b, true) : (isLessThan(a, b) || equals(a, b));
    const moreOrEqual = (a: T, b: T) => hasInfinity(a, b) ? infinityIsMore(b, a, true) : (isLessThan(b, a) || equals(a, b));
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
    const hasInfinity = (a: T, b: T) => (a === infinity || b === infinity);
    
    const concatNext = (...intervals: Array<Interval<T>>) => (current: T) => {
        const owners = intervals.filter(i => i.has(current));

        if (owners.length === 0) {
            return infinity;
        }

        return owners[owners.length - 1].usedNext(current);
    };

    const checkInterval = (start: T, end: T) => {
        if (end !== infinity && isLessThan(end, start)) {
            throw new Error('End of interval cannot come before start');
        }
        if (start === infinity) {
            throw new Error('Cannot start the interval at infinity');
        }

    }

    const generalInterval = (start: T, end: T, next: (current: T) => T): Interval<T> => {
        checkInterval(start, end);
        const interval: Interval<T> = (start: T, end?: T, next?: (iterator: T) => T) => {
            checkInterval(start, end || infinity);
            interval.start = start;
            interval.current = start;
            if (end) {
                interval.end = end;
            }
            if (next) {
                interval.usedNext = next;
            }
            interval.isDone = false;
            return interval;
        };
        interval.isDone = false;
        interval.done = () => interval.isDone;
        interval.usedNext = next;
        interval.start = start;
        interval.current = start;
        interval.end = end;
        interval.it = (iterator: number) => {
            if (iterator <= 0) {
                return interval;
            }
            if (lessOrEqual(interval.current, interval.end)) {
                const nextValue = interval.usedNext(interval.current);
                if (less(interval.end, nextValue)) {
                    interval.isDone = true;
                    return interval;
                } 
                interval.current = nextValue;
                return interval.it(iterator - 1);
            }
            interval.isDone = true;
            return interval; 
        };
        interval.next = () => interval.it(1);
        interval.val = () => interval.current;
        interval.concat = nextInterval => {
            if (!interval.overlap(nextInterval)) {
                return [interval, nextInterval];
            }
            return [generalInterval(
                min(interval.start, nextInterval.start),
                max(interval.end, nextInterval.end),
                less(interval.end, nextInterval.end) ? concatNext(interval, nextInterval) : concatNext(nextInterval, interval),
            )];
        };
        interval.has = value => moreOrEqual(value, interval.start) && lessOrEqual(value, interval.end);
        interval.diff = nextInterval => {
            if (!interval.overlap(nextInterval)) {
                return [interval];
            }
            if (lessOrEqual(interval.start, nextInterval.start) && lessOrEqual(interval.end, nextInterval.end)) {
                return [generalInterval(interval.start, nextInterval.start, interval.usedNext)];
            }
            if (moreOrEqual(interval.start, nextInterval.start) && moreOrEqual(interval.end, nextInterval.end)) {
                return [generalInterval(nextInterval.end, interval.end, interval.usedNext)];
            }
            if (interval.isInside(nextInterval)) {
                return [];
            }
            return [
                generalInterval(interval.start, nextInterval.start, interval.usedNext),
                generalInterval(nextInterval.end, interval.end, interval.usedNext),
            ];
        };
        interval.overlap = nextInterval => interval.has(nextInterval.start) || interval.has(nextInterval.end);
        interval.isInside = nextInterval => nextInterval.has(interval.start) && nextInterval.has(interval.end);
        interval.compare = nextInterval => interval.overlap(nextInterval) ? 0 : (less(interval.start, nextInterval.start) ? -1 : 1);
        interval.copy = () => {
            const copied = generalInterval(interval.start, interval.end, interval.usedNext);
            copied.current = interval.current;
            return copied;
        };
        interval.fillIn = intervals => {
            if (!intervals || intervals.length === 0) {
                return interval;
            }
            const sorted = interval.sort(intervals);
            let filler = sorted[0];
            for (let i = 0; i < sorted.length; i++) {
                const at = sorted[i];
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
            while (!copyInterval.done()) {
                copyInterval.next();
                if (!copyInterval.done()) {
                    aggregate.push(copyInterval.val());
                }
            }
            return aggregate;
        };
        interval.split = split => {
            const intervals: Array<Interval<T>> = [];
            if (interval.end === infinity) {
                throw Error('Cannot split infinite interval');
            }
            const items = interval.array();
            let start = items[0];
            const end = items[items.length - 1];
            items.forEach((item, i) => {
                const next = items[i + 1];
                if (!split(item, next, i)) {
                    intervals.push(generalInterval(start, item, interval.usedNext));
                    start = next;
                }
                if (i === items.length - 1 && split(item, next, i)) {
                    intervals.push(generalInterval(start, end, interval.usedNext));
                }
            });
            return intervals;
        };
        interval.find = (compare, end) => {
            if (typeof compare !== 'function' && !interval.has(compare)) {
                return null;
            }

            if (!end && (end as any) !== 0 && interval.end === infinity) {
                throw Error('Cannot seek inside infinite interval without boundary');
            }

            const trueEnd = (interval.end === infinity || end || end as any === 0) ? end : interval.end;
            const trueCompare = typeof compare === 'function' ? compare as (item: T) => boolean : (item: T) => equals(item, compare);
            const copyInterval = generalInterval(interval.start, trueEnd as any, interval.usedNext);
            while (!copyInterval.done()) {
                if (trueCompare(copyInterval.val())) {
                    return copyInterval.val();
                }
                copyInterval.next();
            }
            return null;
        };
        interval.convert = <E extends AllowedTypes>(to: (item: T) => E, next: (item: E) => E) => {
            let nextEnd: any;
            const nextStart: E = to(interval.start);
            if (interval.end === infinity) {
                switch (typeof nextStart) {
                    case 'number':
                    case 'boolean':
                        nextEnd = Infinity;
                        break;
                    case 'string':
                    case 'object':
                        nextEnd = null;
                        break;
                }
            } else {
                nextEnd = to(interval.end);
            }
            const converted = intervalCreator(nextStart, nextEnd, next) as Interval<E>;
            converted.current = to(interval.current);
            return converted;
        }

        const mapper = (inter: Interval<T>, fn: (copied: Interval<T>, stop: () => boolean, escape: () => void) => void) => {
            let stop = false;
            const copied = inter.copy();
            const escape = () => stop = true; 
            fn(copied, () => stop, escape);
        }
        interval.map = <E>(iterator: (value: T, escape: () => void) => E) => {
            const aggregate: E[] = []; 
            mapper(interval, (copied, stop, escape) => {
                while (!copied.done() && !stop()) {
                    aggregate.push(iterator(copied.val(), escape));
                    copied.next();
                }
            })
            return aggregate;
        }
        interval.forEach = iterator => mapper(
            interval,
            (copied, stop, escape) => {
                while (!copied.done() && !stop()) {
                    iterator(copied.val(), escape);
                    copied.next();
                }
            });
        interval.reduce = <E>(iterator: (previous: E, value: T, escape: () => void) => E, start: E) => {
            let aggregate: E = start; 
            mapper(interval, (copied, stop, escape) => {
                while (!copied.done() && !stop()) {
                    aggregate = iterator(aggregate, copied.val(), escape);
                    copied.next();
                }
            });
            return aggregate;
        };
        interval.closest = (item: T) => {
            if (less(item, interval.start)) {
                return [interval.start];
            }
            if (less(interval.end, item)) {
                return [interval.end];
            }
            const copied = interval.copy();
            let last: T = interval.start;
            while(!copied.next().done()) {
                if (equals(copied.val(), item)) {
                    return [copied.val()];
                }
                if (less(last, item) && less(item, copied.val())) {
                    return [last, copied.val()];
                }
                last = copied.val();
            }
            throw Error('Unexpected result of closest function!');
        };
        interval.reset = () => {
            interval.current = interval.start;
            return interval;
        }
        interval.deep = () => intervalCreator(interval.array());
        return interval;
    };

    return generalInterval;
};
