import interval from "../../src";

describe("Can manipulate numeric intervals", () => {
    test("Can construct default", () => {
        const i = interval();
        expect(i.has(1)).toBe(true);
        expect(i.has(10)).toBe(true);
        expect(i.has(100)).toBe(true);
        expect(i.has(1000)).toBe(true);
    });
    test("Can construct finite interval", () => {
        expect(interval(1, 5, c => c + 1).array()).toEqual([1, 2, 3, 4, 5]);
    });
    test("Move iterator", () => {
        const i = interval(1, Infinity, c => c + 2);
        expect(i.val()).toBe(1);
        expect(i.it(2).val()).toBe(5);
    });
    test("Does an array contain this item? Based on limits not values", () => {
        expect(interval(2, 5).has(4)).toBe(true);
        expect(interval(4, 6).has(7)).toBe(false);
    });
    test("Substracts interval by limits. Can return two intervals", () => {
        expect(interval(2, 10).diff(interval(5, 10))[0].array()).toEqual([2, 3, 4, 5]);
        expect(interval(2, 4).diff(interval(5, 10))[0].array()).toEqual([2, 3, 4]);
        expect(interval(1, 10).diff(interval(2, 8)).map(i => i.array())).toEqual([[1, 2], [8, 9, 10]]);
    });
    test("Concats two intervals. In non-overlapping cases, returns back both intervals", () => {
        expect(interval(2, 4).concat(interval(3, 6))[0].array()).toEqual([2, 3, 4, 5, 6]);
        expect(interval(2, 4).concat(interval(4, 6))[0].array()).toEqual([2, 3, 4, 5, 6]);
        expect(interval(2, 4).concat(interval(4, 7, c => c + 2))[0].array()).toEqual([2, 3, 4, 6]);
        expect(interval(2, 4).concat(interval(5, 7)).map(i => i.array())).toEqual([[2, 3, 4], [5, 6, 7]]);
    });
    test("Creates copy", () => {
        const i = interval(1, 5, c => c + 3);
        expect(i.array()).toEqual(i.copy().array());
    });
    test("Do two intervals overlap?", () => {
        expect(interval(2, 5).overlap(interval(3, 6))).toBe(true);
        expect(interval(2, 5).overlap(interval(5, 6))).toBe(true);
        expect(interval(2, 5).overlap(interval(7, 8))).toBe(false);
        expect(interval(2, 5).overlap(interval(1, 2))).toBe(true);
    });
    test("Are the interval borders container within", () => {
        expect(interval(2, 5).isInside(interval(5, 6))).toBe(false);
        expect(interval(2, 5).isInside(interval(3, 4))).toBe(false);
        expect(interval(3, 4).isInside(interval(2, 5))).toBe(true);
        expect(interval(2, 5).isInside(interval(2, 5))).toBe(true);
    });
    test("Interval comparison, overlap: 0, greater: 1, lesser: -1", () => {
        expect(interval(6, 7).compare(interval(2, 5))).toBe(1);
        expect(interval(2, 5).compare(interval(3, 10))).toBe(0);
        expect(interval(2, 5).compare(interval(5, 10))).toBe(0);
        expect(interval(2, 5).compare(interval(6, 7))).toBe(-1);
    });
    test("Sorts and fills in gaps between intervals", () => {
        expect(
            interval(2, 5, i => i + 2).fillIn([interval(6, 8), interval(-3, -1)]).array()
        ).toEqual([-3, -2, -1, 1, 3, 5, 7, 8]);
    });
});