import interval from "../../src";

const date1 = new Date(2020, 1, 1, 12, 30, 5);
const date2 = new Date(2020, 1, 1, 13, 30, 5);
const date3 = new Date(2020, 1, 2, 12, 30, 5);
const date4 = new Date(2020, 1, 2, 12, 30, 6);
const date5 = new Date(2020, 1, 5, 12, 30, 5);
const date6 = new Date(2020, 1, 5, 13, 30, 5);
const date7 = new Date(2020, 1, 5, 14, 30, 5);
const date8 = new Date(2020, 1, 5, 15, 30, 5);
const date9 = new Date(2020, 1, 5, 16, 30, 5);

const byHour = (date: Date) => {
    const next = new Date(date);
    next.setHours(date.getHours() + 1);
    return next;
};

describe("Can manipulate date intervals", () => {
    test("Can construct default", () => {
        const i = interval(date2);
        expect(i.has(date1)).toBe(false);
        expect(i.has(date3)).toBe(true);
        expect(i.has(date4)).toBe(true);
        expect(i.has(date5)).toBe(true); // if limit is infinite, all strings belong
    });
    test("Can construct finite interval", () => {
        expect(interval(date1, date2, byHour).array()).toEqual([date1, date2]);
    });
    test("Move iterator", () => {
        const i = interval(date1, date4, byHour);
        expect(i.val()).toBe(date1);
        expect(i.it(2).val()).toStrictEqual(byHour(byHour(date1)));
    });
    test("Does an array contain this item? Based on limits not values", () => {
        expect(interval(date1, date4).has(date2)).toBe(true);
        expect(interval(date1, date4).has(date5)).toBe(false);
    });
    test("Substracts interval by limits. Can return two intervals", () => {
        expect(interval(date1, date6, byHour).diff(interval(date1, date5))[0].array()).toEqual([date5, date6]);
        expect(interval(date1, date2, byHour).diff(interval(date3, date4))[0].array()).toEqual([date1, date2]);
        expect(interval(date1, date6, byHour).diff(interval(date2, date5)).map(i => i.array())).toEqual([[date1, date2], [date5, date6]]);
    });
    test("Concats two intervals. In non-overlapping cases, returns back both intervals", () => {
        expect(interval(date5, date7, byHour).concat(interval(date6, date8, byHour))[0].array()).toEqual([date5, date6, date7, date8]);
        expect(interval(date5, date6, byHour).concat(interval(date6, date7, byHour))[0].array()).toEqual([date5, date6, date7]);
        expect(interval(date5, date6, byHour).concat(interval(date6, date8, c => byHour(byHour(c))))[0].array()).toEqual([date5, date6, date8]);
        expect(interval(date5, date6, byHour).concat(interval(date7, date8, byHour)).map(i => i.array())).toEqual([[date5, date6], [date7, date8]]);
    });
    test("Creates copy", () => {
        const i = interval(date1, date2, byHour);
        expect(i.array()).toEqual(i.copy().array());
    });
    test("Do two intervals overlap?", () => {
        expect(interval(date1, date3).overlap(interval(date2, date4))).toBe(true);
        expect(interval(date1, date2).overlap(interval(date2, date3))).toBe(true);
        expect(interval(date1, date2).overlap(interval(date3, date4))).toBe(false);
        expect(interval(date1, date2).overlap(interval(date1, date2))).toBe(true);
    });
    test("Are the interval borders container within", () => {
        expect(interval(date1, date2).isInside(interval(date2, date3))).toBe(false);
        expect(interval(date1, date3).isInside(interval(date2, date4))).toBe(false);
        expect(interval(date2, date3).isInside(interval(date1, date4))).toBe(true);
        expect(interval(date1, date2).isInside(interval(date1, date2))).toBe(true);
    });
    test("Interval comparison, overlap: 0, greater: 1, lesser: -1", () => {
        expect(interval(date4, date5).compare(interval(date1, date2))).toBe(1);
        expect(interval(date1, date3).compare(interval(date2, date4))).toBe(0);
        expect(interval(date1, date2).compare(interval(date2, date4))).toBe(0);
        expect(interval(date1, date2).compare(interval(date4, date5))).toBe(-1);
    });
    test("Sorts and fills in gaps between intervals", () => {
        expect(
            interval(date1, date2, c => byHour(byHour(c))).fillIn([interval(date5, date6, byHour), interval(date8, date9, byHour)]).array()
        ).toEqual([date5, date6, date8, date9]);
    });
    test("Can split a single interval into multiple ones", () => {
        expect(
            interval(date5, date8, byHour).split(d => d.getTime() !== date7.getTime()).map(i => i.array())
        ).toEqual([[date5, date6, date7], [date7, date8]]);
    });
});