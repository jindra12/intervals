export interface Interval<T = number> {
    start: T;
    current: T;
    end: T;
    (start: T, end?: T, next?: (current: T) => T): Interval<T>;
    it: (iterator: number) => Interval<T>;
    usedNext: (current: T) => T;
    next: () => Interval<T>;
    val: () => T;
    array: () => T[];
    has: (item: T) => boolean;
    diff: (interval: Interval<T>) => Interval<T>[];
    concat: (interval: Interval<T>) => Interval<T>[];
    copy: () => Interval<T>;
    overlap: (interval: Interval<T>) => boolean;
    isInside: (interval: Interval<T>) => boolean;
    compare: (interval: Interval<T>) => 1 | 0 | -1;
}