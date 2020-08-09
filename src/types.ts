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
     * Does an array-level search inside the interval. Will fail in case of an infinite interval without end param.
     * Will return all elements matching.
     * @param compare Can either be a function, which returns a match, or an item of interval
     * @param end at which element should the search stop?
     */
    all:  (compare: ((item: T) => boolean) | T, end?: T) => T[];

    /**
     * Substracts interval by limits. Returns null if interval is inside the diffing one
     */
    diff: (interval: Interval<T>) => Interval<T> | null;

    /**
     * Concats two intervals into one
     */
    concat: (interval: Interval<T>) => Interval<T>;

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
     * Filters values in array by a selector. Will work on infinite intervals.
     * When working with infinite interval,
     * it is possible that this will cause an infinite loop,
     * under these conditions: 
     *      interval.start is NOT evaluated as true by the parameter AND
     *      NO other value inside this infinite interval will evaluate as true
     */
    filter: (by: (item: T) => boolean) => Interval<T>;

    /**
     * Returns an array of values from interval in random order. Will fail on infinite intervals
     */
    shuffle: () => T[];

    /**
     * Splits interval into several smaller ones. Will fail on infinite intervals.
     * @param by When this function returns false, an interval with 'current' as its end will be created.
     * Next interval in line will also start with 'current'.
     */
    split: (by: (current: T, next: T, currentIteration: number) => boolean) => Array<Interval<T>>;
    
    /**
     * Returns an interval of type E, with start and end converted
     * @param to Function, which will be used to convert start, end and next of the interval
     * @param next How to get next element in line
     * @param compare Use this function to redefine how the elements are compared. Only necessary when using object interval with defined next function
     */
    convert: <E extends AllowedTypes>(to: (value: T) => E, next?: (item: E) => E, compare?: (a: E, b: E) => number) => Interval<E>;

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

    /**
     * Resets current interval position
     */
    reset: () => Interval<T>;

    /**
     * Returns an array-based interval from the original.
     * Will not work on infinite intervals.
     */
    deep: () => Interval<T>;

    /**
     * Splits an interval into multiple groups then returns a map of arrays of intervals based on classification
     * Will not work on infinite intervals
     */
    classify: <E extends string>(classify: (item: T) => E) => ({ [K in E]: Interval<T>[] });

    /**
     * Does an deep-level merge. Similar to concat, except that this method will merge individual elements of the two intervals.
     * Will not work on infinite intervals
     */
    merge: (int: Interval<T>) => Interval<T>;

    /**
     * Remove and return first element of the interval. Will reset the current position inside the interval.
     */
    pop: () => T | null;

    /**
     * Pushes an element to the end of interval. Will fail on infinite intervals.
     */
    push: (item: T) => Interval<T>;

    /**
     * Pushes an element to the start of the interval. Will reset current position inside the interval.
     */
    unshift: (item: T) => Interval<T>;
}

export type AllowedTypes = string | number | symbol | object | Date | boolean;
export type IntervalType<T> = T extends number 
    ? Interval<number> 
    : (
        T extends string
            ? Interval<string>
            : (
                T extends Date
                    ? Interval<Date>
                    : (
                        T extends (infer U)[]
                            ? Interval<U>
                            : (
                                T extends object
                                    ? Interval<T>
                                    : never
                            )
                    )
            )
    );

export type Simplify<T> = T extends number 
    ? number 
    : (
        T extends string
            ? string
            : (
                T extends Date
                    ? Date
                    : (
                        T extends (infer U)[]
                            ? U
                            : (
                                T extends object
                                    ? T
                                    : never
                            )
                    )
            )
    );

export type EndParam<T> = T extends number 
    ? number
    : (
        T extends string
            ? string | null
            : (
                T extends Date
                    ? Date | null
                    : (
                        T extends []
                            ? never
                            : (
                                T extends object
                                    ? T | null
                                    : never
                            )
                    )
            )
    );

export type IsComparableByDefault<T> = T extends number 
    ? true 
    : (
        T extends string
            ? true
            : (
                T extends Date
                    ? true
                    : (
                        T extends []
                            ? true
                            : (
                                T extends object
                                    ? false
                                    : never
                            )
                    )
            )
    );
