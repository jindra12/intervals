# Intervals documentation

Interval-management is a no-dependency library allowing you to create intervals between two values.


Also can receive a generator function and create array of values between two values, use iterators,
merge, diff, compare, sort and fill in intervals. Advanced operations with intervals are "shallow-compare".


This means that a value belongs in the interval if it is between two values, not because an interval generates it.
Same goes for merging and diffing intervals.

## Setup an interval

```typescript

const interval = interval(); // (0, Infinity), generates all whole numbers
const interval = interval(new Date(2019, 1, 1, 12), new Date(2019, 1, 1, 20), addHour) // Generates time between two dates by hour

```

## Example of use - unit tests

```typescript

expect(interval(2, 10).diff(interval(5, 10))[0].array()).toEqual([2, 3, 4, 5]);
expect(interval(2, 4).diff(interval(5, 10))[0].array()).toEqual([2, 3, 4]);

expect(interval(2, 5).overlap(interval(5, 6))).toBe(true);
expect(interval(2, 5).overlap(interval(7, 8))).toBe(false);

/**
 * Generator function should not mutate the original value
 */
const byHour = (date: Date) => {
    const next = new Date(date);
    next.setHours(date.getHours() + 1);
    return next;
};

expect(interval(date5, date7, byHour).concat(interval(date6, date8, byHour))[0].array()).toEqual([date5, date6, date7, date8]);
expect(interval(date5, date6, byHour).concat(interval(date6, date7, byHour))[0].array()).toEqual([date5, date6, date7]);

```

### Relevant information

If you set undefined/Infinity on 'end' parameter of interval function, the interval will be infinite.
Interval function does not have a sanity check for infinite generation (generator function never reaching end parameter).
Type of interval will be decided based on 'typeof' and 'instance of' (for Date).

Another important feature is the Comparable interface. If you need a custom object iterated over, you can do it like this:

```typescript

class TestData implements Comparable<TestData> {
    public date: Date;
    constructor(date: Date) {
        this.date = date;
    }
    public isLessThan = (test: TestData) => this.date.getTime() < test.date.getTime();
    public equals = (test: TestData) => this.date.getTime() === test.date.getTime();
    public byHour = () => new TestData(this.byHourImpl(this.date));
    private byHourImpl = (date: Date) => {
        const next = new Date(date);
        next.setHours(date.getHours() + 1);
        return next;
    };
}

```

### Added functionality since 1.4.0:

Interval now supports conversion to another type of interval and infinity-interval compatible functions:

1) map
2) reduce
3) forEach

### Unit test examples

```typescript

expect(interval(1, 3, c => c + 1).convert(
    i => i.toString(), i => (parseInt(i, 10) + 1).toString()
).array()).toEqual(['1', '2', '3']);

expect(interval(1, 3, c => c + 1).map(c => c.toString())).toEqual(['1', '2', '3']);

expect(interval(1, 3, c => c + 1).reduce((p, c) => p + c, 0)).toBe(6);

let counter = 1;
interval(1, 3, c => c + 1).forEach(c => {
    expect(c).toBe(counter);
    counter++;
});

expect(interval(1, undefined, c => c + 1).map((c, escape) => {
    if (c > 2) {
        escape();
    }
    return c.toString();
})).toEqual(['1', '2', '3']);

expect(interval(1, undefined, c => c + 1).reduce((p, c, escape) => { 
    if (c > 2) {
        escape();
    }
    return p + c;
}, 0)).toBe(6);

let infCounter = 1;
interval(1, undefined, c => c + 1).forEach((c, escape) => {
    if (c > 2) {
        escape();
    }
    expect(c).toBe(infCounter);
    infCounter++;
});

```

### Added functionality since 1.5.0:

Can find closest neighbours of value. Example:

```typescript

expect(interval(2, 4, c => c + 1).closest(3)).toEqual([3]);
expect(interval(2, 4, c => c + 1).closest(-1)).toEqual([2]);
expect(interval(2, 4, c => c + 1).closest(5)).toEqual([4]);
expect(interval(2, 6, c => c + 2).closest(5)).toEqual([4, 6]);

```

### Added functionality since 1.6.0:

Can create an interval out of an array. Example:

```typescript

expect(interval([1, 2, 4, 5]).it(2).val()).toBe(4);
expect(interval([1, 2, 4, 5]).it(10).val()).toBe(5);
expect(interval([1, 2, 3, 4]).concat(interval([3, 8, 9, 10]))[0].it(3).val()).toBe(8);

```

### Changes since 2.0.0:

Concat and diff functions now return only one interval (in case of diff it can be null if diffing an interval with one that completely overlaps it).

This library does NOT allow you to:

1) Use array() for an explicitly infinite interval
2) Create an object array without next function
3) Start and end parameters cannot be 'function' or 'bigint'
4) Creating an interval with 'end' being before 'start'
5) For an interval to have 'infinite' start


If there are any problems, do not hesitate to create an issue or a pull request. Thank you.
