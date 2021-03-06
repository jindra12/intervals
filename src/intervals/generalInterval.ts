import { Interval, AllowedTypes } from "../types";
import intervalCreator from "../index";

export const createInterval = <T>(
    equals: (a: T, b: T) => boolean,
    isLessThan: (a: T, b: T) => boolean,
    infinity: any,
) => {
    const min = (a: T, b: T) => hasInfinity(a, b) ? getInfinity(a, b) : (isLessThan(a, b) ? a : b);
    const max = (a: T, b: T) => hasInfinity(a, b) ? getNotInfinity(a, b) : isLessThan(a, b) ? b : a;
    const less = (a: T, b: T) => hasInfinity(a, b) ? infinityIsMore(a, b, false) : isLessThan(a, b);
    const lessOrEqual = (a: T, b: T) => hasInfinity(a, b) ? infinityIsMore(a, b, true) : (isLessThan(a, b) || equals(a, b));
    const moreOrEqual = (a: T, b: T) => hasInfinity(a, b) ? infinityIsMore(b, a, true) : (isLessThan(b, a) || equals(a, b));
    const safeEquals = (a: T, b: T) => a === infinity && b === infinity || (!hasInfinity(a, b) && equals(a, b));
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
    
    const concatNext = (a: Interval<T>, b: Interval<T>) => (current: T) => {
        if (b.has(current)) {
            return b.usedNext(current);
        } else if (a.has(current)) {
            return a.usedNext(current);
        } else if (less(a.end, current) && less(current, b.start)) {
            return b.start
        }
        return b.end;
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
            if (less(interval.current, interval.end)) {
                const nextValue = interval.usedNext(interval.current);
                if (less(nextValue, interval.end)) {
                    interval.current = nextValue;
                    return interval.it(iterator - 1);
                }
                if (safeEquals(nextValue, interval.end)) {
                    interval.current = nextValue;
                    return interval;
                }
                if (less(interval.end, nextValue)) {
                    interval.isDone = true;
                    return interval;
                }
            }
            if (safeEquals(interval.current, interval.end)) {
                interval.isDone = true;
                return interval;
            }
            throw Error('Iterator sanity check failed!');
        };
        interval.next = () => interval.it(1);
        interval.val = () => interval.current;
        interval.concat = nextInterval => generalInterval(
            min(interval.start, nextInterval.start),
            max(interval.end, nextInterval.end),
            less(interval.end, nextInterval.end) 
                ? concatNext(interval, nextInterval)
                : concatNext(nextInterval, interval),
        );
        interval.has = value => moreOrEqual(value, interval.start) && lessOrEqual(value, interval.end);
        interval.diff = nextInterval => {
            if (!interval.overlap(nextInterval)) {
                return interval;
            }
            if (lessOrEqual(interval.start, nextInterval.start) && lessOrEqual(interval.end, nextInterval.end)) {
                return generalInterval(interval.start, nextInterval.start, interval.usedNext);
            }
            if (moreOrEqual(interval.start, nextInterval.start) && moreOrEqual(interval.end, nextInterval.end)) {
                return generalInterval(nextInterval.end, interval.end, interval.usedNext);
            }
            if (interval.isInside(nextInterval)) {
                return null;
            }
            return generalInterval(interval.start, interval.end, next => {
                if (less(next, nextInterval.start)) {
                    return interval.usedNext(next);
                }
                if (lessOrEqual(nextInterval.end, next)) {
                    return interval.usedNext(next);
                }
                return nextInterval.end;
            });
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
                    filler = filler.concat(at);
                } else {
                    filler = filler.concat(interval(filler.end, at.start, interval.usedNext).concat(at));
                }
            }
            return filler;
        }
        interval.sort = intervals => [...intervals].sort((a, b) => a.compare(b))
        interval.array = () => {
            if (interval.end === infinity) {
                throw Error('Cannot count to Infinity!');
            }
            if (interval.done()) {
                return [];
            }
            const aggregate: T[] = [];
            const copyInterval = interval.copy();
            while (!copyInterval.done()) {
                aggregate.push(copyInterval.val());
                copyInterval.next();
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
                if (i === items.length - 1) {
                    intervals.push(generalInterval(start, end, interval.usedNext));
                } else if (!split(item, next, i)) {
                    intervals.push(generalInterval(start, item, interval.usedNext));
                    start = next;
                }
            });
            return intervals;
        };
        const findHelper = (
            compare: T | ((item: T) => boolean),
            end?: T,
        ) => {
            if (!end && (end as any) !== 0 && interval.end === infinity) {
                throw Error('Cannot seek inside infinite interval without boundary');
            }

            const trueEnd = (interval.end === infinity || end || end as any === 0) ? end : interval.end;
            const trueCompare = typeof compare === 'function' ? compare as (item: T) => boolean : (item: T) => safeEquals(item, compare);
            const copyInterval = generalInterval(interval.start, trueEnd as any, interval.usedNext);
            return {
                trueCompare,
                copyInterval,
            };
        };
        interval.find = (compare, end) => {
            if (typeof compare !== 'function' && !interval.has(compare)) {
                return null;
            }
            const { trueCompare, copyInterval } = findHelper(compare, end);
            while (!copyInterval.done()) {
                if (trueCompare(copyInterval.val())) {
                    return copyInterval.val();
                }
                copyInterval.next();
            }
            return null;
        };
        interval.all = (compare, end) => {
            if (typeof compare !== 'function' && !interval.has(compare)) {
                return [];
            }
            const { trueCompare, copyInterval } = findHelper(compare, end);
            const aggregate: T[] = [];
            while (!copyInterval.done()) {
                if (trueCompare(copyInterval.val())) {
                    aggregate.push(copyInterval.val());
                }
                copyInterval.next();
            }
            return aggregate;
        };
        interval.convert = <E extends AllowedTypes>(to: (item: T) => E, next?: (item: E) => E, compare?: (a: E, b: E) => number) => {
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
            if (!next) {
                if (safeEquals(nextEnd, infinity)) {
                    throw Error('Cannot convert an infinite interval without next function');
                }
                return intervalCreator(interval.array().map(to));
            }
            const converted = intervalCreator(nextStart, nextEnd, next, compare as any) as Interval<E>;
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
                while (!stop()) {
                    aggregate.push(iterator(copied.val(), escape));
                    copied.next();
                    if (copied.done()) {
                        break;
                    }
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
            let last: T = interval.start;
            let toReturn: T[] = [];
            mapper(interval, (copied, stop, escape) => {
                while (!copied.done() && !stop()) {
                    if (safeEquals(copied.val(), item)) {
                        escape();
                        toReturn = [copied.val()];
                    }
                    if (less(last, item) && less(item, copied.val())) {
                        escape();
                        toReturn = [last, copied.val()];
                    }
                    last = copied.val();
                    copied.next();
                }
            });
            if (toReturn.length === 0) {
                throw Error('Unexpected result of closest function');
            }
            return toReturn;
        };
        interval.reset = () => {
            interval.current = interval.start;
            interval.isDone = false;
            return interval;
        }
        interval.deep = () => intervalCreator(interval.array());
        interval.classify = <E extends string>(classify: (item: T) => E) => {
            const split = interval.split((current, next) => classify(current) === classify(next));
            const map: { [key: string]: Array<Interval<T>> } = {};
            split.forEach(int => {
                const index = classify(int.start);
                if (!map[index]) {
                    map[index] = [];
                }
                map[index].push(int);
            });
            return map as { [K in E]: Array<Interval<T>> };
        };
        interval.merge = int => intervalCreator(
            [
                ...interval.array(),
                ...int.array(),
            ].sort((a, b) => safeEquals(a, b) ? 0 : (less(a, b) ? -1 : 1))
        ) as any;
        interval.pop = () => {
            if (interval.isDone) {
                return null;
            }
            const prevStart = interval.start;
            interval.start = interval.usedNext(prevStart);
            interval.current = interval.usedNext(prevStart);
            return prevStart;
        };
        interval.push = item => {
            if (safeEquals(item, infinity)) {
                throw Error('Cannot push into infinite interval');
            }
            const prevEnd = interval.end;
            const prevUsed = interval.usedNext;
            interval.isDone = false;
            interval.usedNext = current => {
                if (safeEquals(current, prevEnd)) {
                    return item;
                }
                return prevUsed(current);
            };
            interval.end = item;
            return interval;
        };
        interval.unshift = item => {
            const prevStart = interval.start;
            const prevUsed = interval.usedNext;
            interval.isDone = false;
            interval.start = item;
            interval.current = item; 
            interval.usedNext = current => {
                if (safeEquals(item, current)) {
                    return prevStart;
                }
                return prevUsed(current);
            }
            return interval;
        }
        interval.filter = by => {
            const prevUsed = interval.usedNext;
            interval.usedNext = current => {
                const val = prevUsed(current);
                if (by(val)) {
                    return val;
                }
                return interval.usedNext(val);
            }
            let nextStart = interval.start;
            while (!by(nextStart)) {
                nextStart = prevUsed(nextStart);
                if (less(interval.end, nextStart)) {
                    interval.isDone = true;
                    return interval;
                }
            }
            interval.start = nextStart;
            return interval;
        };
        interval.shuffle = () => {
            const acc: T[] = [];
            const orig = interval.array();
            while (orig.length !== 0) {
                const index = Math.floor(Math.random() * (orig.length - 1));
                acc.push(...orig.splice(index, 1));
            }
            return acc;
        };
        return interval;
    };

    return generalInterval;
};
