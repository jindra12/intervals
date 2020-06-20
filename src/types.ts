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
}

/**
 * Comparison interface, needs to be implemented in order for object intervals to work
 */
export interface Comparable {
    equals: <T extends Comparable>(item: T) => boolean;
    isLessThan: <T extends Comparable>(item: T) => boolean;
}