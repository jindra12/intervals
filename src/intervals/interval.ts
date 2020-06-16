import { Interval } from "../types";

const isNumberOtherThanZero = <T>(end: T) => typeof end === 'number' && end !== 0;

const createIterator = <T>(interval: Interval<T>, next: (iterator: T) => T) => (iterator: number) => {
    if (iterator <= 0) {
        return interval;
    }
    if ((isNumberOtherThanZero(interval.end) && !interval.end) /* no end */ || interval.end !== interval.current /** current is not at its end */) {
        interval.current = next(interval.current);
        return interval.it(iterator--);
    }
    return interval; 
};

const intervalImpl = <T = number>(start: T, end: T, next: (current: T) => T): Interval<T> => {
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
            interval.it = createIterator(interval, next);
        }
        return interval;
    };
    interval.start = start;
    interval.current = start;
    interval.end = end;
    interval.it = createIterator(interval, next);
    interval.next = () => interval.it(1);
    interval.val = () => interval.current;
    return interval;
};

export const interval = <T>(start?: T, end?: T, next?: (current: T) => T) => {
    if (!start) {
        return intervalImpl(0, Infinity, num => num++);
    }
    if (!next) {
        switch (typeof start) {
            case 'number':
                if (typeof end === 'number') {
                    return intervalImpl(start, !end ? Infinity : end, num => num++);
                }
                break;
            case 'boolean':
                return intervalImpl(start ? 1 : 0, end ? 1 : 0, num => !num ? 1 : 0);
            case 'function':
            case 'object':
            case 'bigint':
                return undefined;
            case 'string':
            case 'symbol':
                if (start.toString().length !== 1) {
                    return undefined;
                }
                if (typeof end !== 'string' || typeof end !== 'symbol') {
                    return undefined;
                }
                const val = start.toString();
                return intervalImpl(val, end.toString(), char => String.fromCharCode((char.charCodeAt(0) + 1)));
        }
    }

    return undefined;
}

