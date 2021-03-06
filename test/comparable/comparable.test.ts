import interval from "../../src";

declare global {
    namespace jest {
        interface Matchers<R> {
            dateEqualSingle(a: TestData): R;
            dateEqual(a: TestData[]): R;
            dateEqualMulti(a: TestData[][]): R;
        }
    }
}

class TestData {
    public date: Date;
    constructor(date: Date) {
        this.date = date;
    }
    public byHour = () => new TestData(this.byHourImpl(this.date));
    private byHourImpl = (date: Date) => {
        const next = new Date(date);
        next.setHours(date.getHours() + 1);
        return next;
    };
}

const compare = (a: TestData, b: TestData) => a.date.getTime() - b.date.getTime();

const comparable1 = new TestData(new Date(2020, 1, 1, 12, 30, 5));
const comparable2 = new TestData(new Date(2020, 1, 1, 13, 30, 5));
const comparable3 = new TestData(new Date(2020, 1, 2, 12, 30, 5));
const comparable4 = new TestData(new Date(2020, 1, 2, 12, 30, 6));
const comparable5 = new TestData(new Date(2020, 1, 5, 12, 30, 5));
const comparable6 = new TestData(new Date(2020, 1, 5, 13, 30, 5));
const comparable7 = new TestData(new Date(2020, 1, 5, 14, 30, 5));
const comparable8 = new TestData(new Date(2020, 1, 5, 15, 30, 5));
const comparable9 = new TestData(new Date(2020, 1, 5, 16, 30, 5));

const byHour = (test: TestData) => test.byHour();
const compareDates = (received: TestData[], expected: TestData[]) => Boolean(received.find((rec, i) => rec.date.getTime() !== expected[i]?.date.getTime()));

expect.extend({
    dateEqualSingle: (received: TestData, expected: TestData) => received.date.getTime() !== expected.date.getTime()
    ? {
        message: () => 'Test object array not equal!',
        pass: false,
    } : {
        message: () => 'Test object array equal!',
        pass: true,
    },
    dateEqual: (received: TestData[], expected: TestData[]) => compareDates(received, expected)
        ? {
            message: () => 'Test object array not equal!',
            pass: false,
        } : {
            message: () => 'Test object array equal!',
            pass: true,
        },
    dateEqualMulti: (received: TestData[][], expected: TestData[][]) => Boolean(received.find((r, i) => !expected[i] || compareDates(r, expected[i])))
    ? {
        message: () => 'Test object array not equal!',
        pass: false,
    } : {
        message: () => 'Test object array equal!',
        pass: true,
    },
})

describe("Can manipulate custom object intervals intervals", () => {
    test("Can construct default", () => {
        const i = interval(comparable2, undefined, byHour, compare);
        expect(i.has(comparable1)).toBe(false);
        expect(i.has(comparable3)).toBe(true);
        expect(i.has(comparable4)).toBe(true);
        expect(i.has(comparable5)).toBe(true); // if limit is infinite, all strings belong
    });
    test("Can construct finite interval", () => {
        expect(interval(comparable1, comparable2, byHour, compare).array()).dateEqual([comparable1, comparable2]);
    });
    test("Move iterator", () => {
        const i = interval(comparable1, comparable4, byHour, compare);
        expect(i.val()).toBe(comparable1);
        expect(i.it(2).val()).dateEqualSingle(byHour(byHour(comparable1)));
    });
    test("Does an array contain this item? Based on limits not values", () => {
        expect(interval(comparable1, comparable4, byHour, compare).has(comparable2)).toBe(true);
        expect(interval(comparable1, comparable4, byHour, compare).has(comparable5)).toBe(false);
    });
    test("Substracts interval by limits", () => {
        expect(interval(comparable1, comparable6, byHour, compare).diff(interval(comparable1, comparable5, byHour, compare))?.array()).dateEqual([comparable5, comparable6]);
        expect(interval(comparable1, comparable2, byHour, compare).diff(interval(comparable3, comparable4, byHour, compare))?.array()).dateEqual([comparable1, comparable2]);
        expect(interval(comparable1, comparable6, byHour, compare).diff(interval(comparable2, comparable5, byHour, compare))?.array()).dateEqual([comparable1, comparable2, comparable5, comparable6]);
    });
    test("Concats two intervals", () => {
        expect(interval(comparable5, comparable7, byHour, compare).concat(interval(comparable6, comparable8, byHour, compare)).array()).dateEqual([comparable5, comparable6, comparable7, comparable8]);
        expect(interval(comparable5, comparable6, byHour, compare).concat(interval(comparable6, comparable7, byHour, compare)).array()).dateEqual([comparable5, comparable6, comparable7]);
        expect(interval(comparable5, comparable6, byHour, compare).concat(interval(comparable6, comparable8, c => byHour(byHour(c)), compare)).array()).dateEqual([comparable5, comparable6, comparable8]);
        expect(interval(comparable5, comparable6, byHour, compare).concat(interval(comparable7, comparable8, byHour, compare)).array()).dateEqual([comparable5, comparable6, comparable7, comparable8]);
    });
    test("Creates copy", () => {
        const i = interval(comparable1, comparable2, byHour, compare);
        expect(i.array()).dateEqual((i.copy().array() as TestData[]));
    });
    test("Do two intervals overlap?", () => {
        expect(interval(comparable1, comparable3, byHour, compare).overlap(interval(comparable2, comparable4, byHour, compare))).toBe(true);
        expect(interval(comparable1, comparable2, byHour, compare).overlap(interval(comparable2, comparable3, byHour, compare))).toBe(true);
        expect(interval(comparable1, comparable2, byHour, compare).overlap(interval(comparable3, comparable4, byHour, compare))).toBe(false);
        expect(interval(comparable1, comparable2, byHour, compare).overlap(interval(comparable1, comparable2, byHour, compare))).toBe(true);
    });
    test("Are the interval borders container within", () => {
        expect(interval(comparable1, comparable2, byHour, compare).isInside(interval(comparable2, comparable3, byHour, compare))).toBe(false);
        expect(interval(comparable1, comparable3, byHour, compare).isInside(interval(comparable2, comparable4, byHour, compare))).toBe(false);
        expect(interval(comparable2, comparable3, byHour, compare).isInside(interval(comparable1, comparable4, byHour, compare))).toBe(true);
        expect(interval(comparable1, comparable2, byHour, compare).isInside(interval(comparable1, comparable2, byHour, compare))).toBe(true);
    });
    test("Interval comparison, overlap: 0, greater: 1, lesser: -1", () => {
        expect(interval(comparable4, comparable5, byHour, compare).compare(interval(comparable1, comparable2, byHour, compare))).toBe(1);
        expect(interval(comparable1, comparable3, byHour, compare).compare(interval(comparable2, comparable4, byHour, compare))).toBe(0);
        expect(interval(comparable1, comparable2, byHour, compare).compare(interval(comparable2, comparable4, byHour, compare))).toBe(0);
        expect(interval(comparable1, comparable2, byHour, compare).compare(interval(comparable4, comparable5, byHour, compare))).toBe(-1);
    });
    test("Sorts and fills in gaps between intervals", () => {
        expect(
            interval(comparable1, comparable2, c => byHour(byHour(c)), compare).fillIn([interval(comparable5, comparable6, byHour, compare), interval(comparable8, comparable9, byHour, compare)]).array()
        ).dateEqual( [comparable5, comparable6, comparable8, comparable9]);
    });
    test("Can split a single interval into multiple ones", () => {
        expect(
            interval(comparable5, comparable8, byHour, compare).split(d => !!compare(d, comparable6)).map(i => i.array())
        ).dateEqualMulti([[comparable5, comparable6], [comparable7, comparable8]]);
    });
    test("Can do an array-level interval search", () => {
        expect(interval(comparable5, comparable8, byHour, compare).find(comparable6)).dateEqualSingle(comparable6);
        expect(interval(comparable5, comparable8, byHour, compare).find(d => d.date.getFullYear() === 2021)).toEqual(null);
        expect(interval(comparable5, comparable8, byHour, compare).find(comparable9)).toEqual(null);
        expect(interval(comparable5, undefined, byHour, compare).find(comparable6, comparable8)).dateEqualSingle(comparable6);
        expect(interval(comparable5, comparable8, byHour, compare).find(d => d > comparable6, comparable6)).toEqual(null);
        expect(interval(comparable5, comparable8, byHour, compare).find(comparable1)).toEqual(null);
    });
    test("Can convert to number", () => {
        expect(interval(comparable5, comparable7, byHour, compare).convert(
            s => s.date.getTime(), s => s + 1000 * 60 * 60,
        ).array()).toEqual([comparable5.date.getTime(), comparable6.date.getTime(), comparable7.date.getTime()])
    });
    test("Can convert to another object", () => {
        expect(interval(comparable5, null, byHour, compare).convert(
            comp => ({ value: comp.date }),
            val => {
                const nextDate = new Date(val.value);
                nextDate.setHours(nextDate.getHours() + 1);
                return { value: nextDate };
            },
            (a, b) => a.value.getTime() - b.value.getTime()
        ).it(2).val().value.getTime()).toBe(comparable7.date.getTime());
    });
});