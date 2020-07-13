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
    test("Substracts interval by limits", () => {
        expect(interval(2, 10).diff(interval(5, 10))?.array()).toEqual([2, 3, 4, 5]);
        expect(interval(2, 4).diff(interval(5, 10))?.array()).toEqual([2, 3, 4]);
        expect(interval(1, 10).diff(interval(2, 8))?.array()).toEqual([1, 2, 8, 9, 10]);
        expect(interval(1, Infinity).diff(interval(3, Infinity))?.array()).toEqual([1, 2, 3]);
    });
    test("Concats two intervals", () => {
        expect(interval(2, 4).concat(interval(3, 6)).array()).toEqual([2, 3, 4, 5, 6]);
        expect(interval(2, 4).concat(interval(4, 6)).array()).toEqual([2, 3, 4, 5, 6]);
        expect(interval(2, 4).concat(interval(4, 7, c => c + 2)).array()).toEqual([2, 3, 4, 6]);
        expect(interval(2, 4).concat(interval(5, 7)).array()).toEqual([2, 3, 4, 5, 6, 7]);
        expect(interval(1, Infinity).concat(interval(-1, Infinity)).it(2).val()).toBe(1);
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
    test("Can split a single interval into multiple ones", () => {
        expect(
            interval(0, 15, n => n + 5).split(c => c !== 10).map(i => i.array())
        ).toEqual([[0, 5, 10], [15]]);
    });
    test("Can do an array-level interval search", () => {
        expect(interval(0, 10, n => n + 2).find(2)).toBe(2);
        expect(interval(0, 10, n => n + 2).find(n => n % 2 === 1)).toBe(null);
        expect(interval(0, 10, n => n + 2).find(11)).toBe(null);
        expect(interval(0, Infinity, n => n + 2).find(2, 5)).toBe(2);
        expect(interval(0, 10, n => n + 2).find(n => n > 5, 3)).toBe(null);
        expect(interval(0, 10, n => n + 2).find(3)).toBe(null);
    });
    test("Can convert to string", () => {
        expect(interval(1, 3, c => c + 1).convert(
            i => i.toString(), i => (parseInt(i, 10) + 1).toString()
        ).array()).toEqual(['1', '2', '3']);
        expect(interval(1, undefined, c => c + 1).convert(
            i => i.toString(), i => (parseInt(i, 10) + 1).toString()
        ).it(5).val()).toBe('6');
        expect(interval([1, 2, 3]).convert(n => n.toString()).array()).toEqual(['1', '2', '3']);
    });
    test("Can do a reduce, map and foreach", () => {
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
    });
    test("Copy/Converted interval will copy current position", () => {
        expect(interval().it(2).copy().val()).toBe(2);
        expect(interval(0, 3).it(2).convert(n => n.toString(), s => (parseInt(s, 10) + 1).toString()).val()).toBe('2');
    });
    test("Can find the closest values in the interval", () => {
        expect(interval(2, 4, c => c + 1).closest(3)).toEqual([3]);
        expect(interval(2, 4, c => c + 1).closest(-1)).toEqual([2]);
        expect(interval(2, 4, c => c + 1).closest(5)).toEqual([4]);
        expect(interval(2, 6, c => c + 2).closest(5)).toEqual([4, 6]);
    });
    test("Can create interval out of an array", () => {
        expect(interval([1, 2, 4, 5]).it(2).val()).toBe(4);
        expect(interval([1, 2, 4, 5]).it(10).val()).toBe(5);
        expect(interval([1, 2, 3, 4]).concat(interval([3, 8, 9, 10])).it(3).val()).toBe(8);
        expect(interval([1, 2, 3]).array()).toEqual([1, 2, 3]);
    });
    test("Can reset an interval", () => {
        expect(interval([1, 2, 3]).it(2).reset().it(1).val()).toBe(2);
    });
    test("Can create an array interval copy", () => {
        expect(interval(0, 3).deep().it(1).val()).toBe(1);
    });
    test("Can classify intervals based on custom criteria", () => {
        expect(interval([1, 2, 3, 4, 5, 6]).classify(n => n % 2 ? 'odd' : 'even')['odd'][0].array()).toEqual([1]);
    });
    test("Can merge items of two intervals together", () => {
        expect(interval([1, 3, 4]).merge(interval([-1, 2, 5])).array()).toEqual([-1, 1, 2, 3, 4, 5]);
    });
    test("Can find all items matching a pattern", () => {
        expect(interval([1, 2, 3, 4]).all(i => i < 3)).toEqual([1, 2]);
        expect(interval([1, 2, 3, 4]).all(3)).toEqual([3]);
        expect(interval(1, Infinity).all(i => i < 10, 5)).toEqual([1, 2, 3, 4, 5]);
    });
    test("Can unshift into intervals", () => {
        expect(interval([1, 2, 3, 4]).unshift(0).array()).toEqual([0, 1, 2, 3, 4]);
        expect(interval(2, 8, n => n + 2).unshift(1).array()).toEqual([1, 2, 4, 6, 8]);
        expect(interval(0, Infinity, c => c + 1).unshift(-1).unshift(-2).has(-1)).toBe(true);
    });
    test("Can push into finite intervals", () => {
        expect(interval([1, 2, 3, 4]).push(5).array()).toEqual([1, 2, 3, 4, 5]);
        expect(interval(2, 8, n => n + 2).push(9).array()).toEqual([2, 4, 6, 8, 9]);
    });
    test("Can pop from intervals", () => {
        expect(interval([1, 2, 3, 4]).pop()).toBe(1);
        expect(interval(2, 8, n => n + 2).pop()).toBe(2);
        const poppy = interval(1, 5, c => c + 2);
        poppy.pop();
        poppy.pop();
        expect(poppy.array()).toEqual([5]);
        const inf = interval(0, Infinity, c => c + 1);
        inf.pop();
        expect(inf.has(0)).toBe(false);
    });
});