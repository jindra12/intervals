export interface Interval<T = number> {
    start: T;
    current: T;
    end: T;
    (start: T, end?: T, next?: (current: T) => T): Interval<T>;
    it: (iterator: number) => Interval<T>;
    next: () => Interval<T>;
    val: () => T;
}