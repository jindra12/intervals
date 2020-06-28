export interface Interval<T = number> {
    /**
     * Starting iterator position
     */
    start: T;
    /**
     * Current iterator position
     */
    current: T;
    /**
     * End-limit of array (can be infinite)
     */
    end: T;
    /**
     * Are all iterations exhausted?
     */
    isDone: boolean;
    /**
     * Create another interval
     */
    (start: T, end?: T, next?: (current: T) => T): Interval<T>;
    /**
     * Are all iterations exhausted?
     */    
    done: () => boolean;
    /**
     * Move iterator
     */
    it: (iterator: number) => Interval<T>;
    /**
     * Which function is used to generate elements in array
     */
    usedNext: (current: T) => T;
    /**
     * Move iterator by one
     */
    next: () => Interval<T>;
    /**
     * Value based on iteration
     */
    val: () => T;
    /**
     * Generates all elements within interval. Will fail when tasked to create infinite array
     */
    array: () => T[];
    /**
     * Does an array contain this item? (based on limits for inifite intervals, not next function)
     */
    has: (item: T) => boolean;
    /**
     * Does an array-level search inside the interval. Will fail in case of an infinite interval without end param.
     * @param compare Can either be a function, which returns a match, or an item of interval
     * @param end at which element should the search stop?
     */
    find: (compare: ((item: T) => boolean) | T, end?: T) => T | null;
    /**
     * Substracts interval by limits. Can return two intervals
     */
    diff: (interval: Interval<T>) => Interval<T>[];
    /**
     * Concats two intervals. In non-overlapping cases, returns back both intervals
     */
    concat: (interval: Interval<T>) => Interval<T>[];
    /**
     * Creates copy
     */
    copy: () => Interval<T>;
    /**
     * Do two intervals overlap?
     */
    overlap: (interval: Interval<T>) => boolean;
    /**
     * Are the interval borders container within
     */
    isInside: (interval: Interval<T>) => boolean;
    /**
     * Interval comparison, overlap: 0, greater: 1, lesser: -1
     */
    compare: (interval: Interval<T>) => 1 | 0 | -1;
    /**
     * Sorts and fills in gaps between intervals
     */
    fillIn: (intervals: Array<Interval<T>>) => Interval<T>;
    /**
     * Sorts an array of intervals. DOES NOT mutate the original array
     */
    sort: (intervals: Array<Interval<T>>) => Array<Interval<T>>;
    /**
     * Splits interval into several smaller ones. Will fail on infinite intervals.
     * @param by When this function returns false, an interval with 'current' as its end will be created.
     * Next interval in line will also start with 'current'.
     */
    split: (by: (current: T, next: T | null, currentIteration: number) => boolean) => Array<Interval<T>>;
    
    /**
     * Returns an interval of type E, with start and end converted
     * @param to Function, which will be used to convert start, end and next of the interval
     * @param next How to get next element in line
     */
    convert: <E extends AllowedTypes>(to: (value: T) => E, next: (item: E) => E) => Interval<E>;

    /**
     * Map function which can deal with infinite intervals. This function does not mutate interval.
     * @param iterator function which will be used to iterate over interval elements. Escape will end run immediately and return values.
     */
    map: <E>(iterator: (value: T, escape: () => void) => E) => E[];

    /**
     * ForEach function which can deal with infinite intervals. This function does not mutate interval.
     * @param iterator function which will be used to iterate over interval elements. Escape will end run immediately.
     */
    forEach: (iterator: (value: T, escape: () => void) => void) => void;

    /**
     * Reduce function which can deal with infinite intervals. This function does not mutate interval.
     * @param iterator function which will be used to iterate over interval elements. Escape will end run immediately and return reduced value.
     */
    reduce: <E>(iterator: (previous: E, value: T, escape: () => void) => E, start: E) => E;

    /**
     * Find equal, one or two closest elements
     * @param item Item to be found
     */
    closest: (item: T) => T[];
}

/**
 * Comparison interface, needs to be implemented in order for object intervals to work
 */
interface IComparable<T> {
    equals: (item: T) => boolean;
    isLessThan: (item: T) => boolean;
}

export type AllowedTypes = string | number | symbol | Comparable<any> | Date | boolean;
export type IntervalType<T> = T extends number 
    ? Interval<number> 
    : (
        T extends string
            ? Interval<string>
            : (
                T extends Date
                    ? Interval<Date>
                    : (
                        T extends Comparable<T>
                            ? Interval<Comparable<T>>
                            : (
                                T extends (infer U)[]
                                    ? Interval<U>
                                    : never
                            )
                    )
            )
    );

export interface InnerComparable {
    equals: <T extends InnerComparable>(item: T) => boolean;
    isLessThan: <T extends InnerComparable>(item: T) => boolean;
}

export type Comparable<T> = T & IComparable<T>;