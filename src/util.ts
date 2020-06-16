import { Interval } from "./types";

export const isNumberOtherThanZero = <T>(end: T) => typeof end === 'number' && end !== 0;

export const createIterator = <T>(interval: Interval<T>, next: (iterator: T) => T) => (iterator: number) => {
    if (iterator <= 0) {
        return interval;
    }
    if ((isNumberOtherThanZero(interval.end) && !interval.end) /* no end */ || interval.end !== interval.current /** current is not at its end */) {
        interval.current = next(interval.current);
        return interval.it(iterator--);
    }
    return interval; 
};