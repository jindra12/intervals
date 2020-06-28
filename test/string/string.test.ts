import interval from "../../src";

describe("Can manipulate string intervals", () => {
    test("Can construct default", () => {
        const i = interval('a');
        expect(i.has('a')).toBe(true);
        expect(i.has('aa')).toBe(true);
        expect(i.has('aaa')).toBe(true);
        expect(i.has('b')).toBe(true); // if limit is infinite, all strings belong
    });
    test("Can construct finite interval", () => {
        expect(interval('a', 'aaa', c => c + 'a').array()).toEqual(['a', 'aa', 'aaa']);
    });
    test("Move iterator", () => {
        const i = interval('a', 'abcd', c => `${c}${String.fromCharCode(c.charCodeAt(c.length - 1) + 1)}`);
        expect(i.val()).toBe('a');
        expect(i.it(2).val()).toBe('abc');
    });
    test("Does an array contain this item? Based on limits not values", () => {
        expect(interval('a', 'aa').has('a')).toBe(true);
        expect(interval('a', 'aaa').has('b')).toBe(false);
    });
    test("Substracts interval by limits. Can return two intervals", () => {
        expect(interval('a', 'aaaaa').diff(interval('aa', 'aaaaa'))[0].array()).toEqual(['a', 'aa']);
        expect(interval('a', 'aa').diff(interval('aaa', 'aaaa'))[0].array()).toEqual(['a', 'aa']);
        expect(interval('a', 'aaaaaa', c => c + 'a').diff(interval('aa', 'aaaa')).map(i => i.array())).toEqual([['a', 'aa'], ['aaaa', 'aaaaa', 'aaaaaa']]);
    });
    test("Concats two intervals. In non-overlapping cases, returns back both intervals", () => {
        expect(interval('a', 'aaa', c => c + 'a').concat(interval('aa', 'aaaa', c => c + 'a'))[0].array()).toEqual(['a', 'aa', 'aaa', 'aaaa']);
        expect(interval('a', 'aaa', c => c + 'a').concat(interval('aaa', 'aaaa', c => c + 'a'))[0].array()).toEqual(['a', 'aa', 'aaa', 'aaaa']);
        expect(interval('a', 'aaa', c => c + 'a').concat(interval('aaa', 'aaab', c => c + 'b'))[0].array()).toEqual(['a', 'aa', 'aaa', 'aaab']);
        expect(interval('a', 'aaa', c => c + 'a').concat(interval('aaaa', 'aaaaa', c => c + 'a')).map(i => i.array())).toEqual([['a', 'aa', 'aaa'], ['aaaa', 'aaaaa']]);
    });
    test("Creates copy", () => {
        const i = interval(1, 5, c => c + 3);
        expect(i.array()).toEqual(i.copy().array());
    });
    test("Do two intervals overlap?", () => {
        expect(interval('a', 'aaa').overlap(interval('aa', 'aaaa'))).toBe(true);
        expect(interval('a', 'aa').overlap(interval('aa', 'aaa'))).toBe(true);
        expect(interval('a', 'aa').overlap(interval('aaa', 'aaaa'))).toBe(false);
        expect(interval('aa', 'aaa').overlap(interval('a', 'aa'))).toBe(true);
    });
    test("Are the interval borders container within", () => {
        expect(interval('aa', 'aaa').isInside(interval('aaa', 'aaaa'))).toBe(false);
        expect(interval('a', 'aaaa').isInside(interval('aa', 'aaa'))).toBe(false);
        expect(interval('aa', 'aaa').isInside(interval('a', 'aaaa'))).toBe(true);
        expect(interval('a', 'aa').isInside(interval('a', 'aa'))).toBe(true);
    });
    test("Interval comparison, overlap: 0, greater: 1, lesser: -1", () => {
        expect(interval('aaaa', 'aaaaa').compare(interval('a', 'aaa'))).toBe(1);
        expect(interval('a', 'aaa').compare(interval('aa', 'aaaa'))).toBe(0);
        expect(interval('a', 'aa').compare(interval('aa', 'aaa'))).toBe(0);
        expect(interval('a', 'aaa').compare(interval('aaaa', 'aaaaa'))).toBe(-1);
    });
    test("Sorts and fills in gaps between intervals", () => {
        expect(
            interval('b', 'bb', c => c + 'b').fillIn([interval('aa', 'aaa', c => c + 'a'), interval('aaab', 'aaaba', c => c + 'a')]).array()
        ).toEqual(['aa', 'aaa', 'aaab', 'aaaba']);
    });
    test("Can split a single interval into multiple ones", () => {
        expect(
            interval('a', 'aaaa', s => s + 'a').split(c => c !== 'aaa').map(i => i.array())
        ).toEqual([['a', 'aa', 'aaa'], ['aaaa']]);
    });
    test("Can do an array-level interval search", () => {
        expect(interval('a', 'aaaa', s => s + 'a').find('aa')).toBe('aa');
        expect(interval('a', 'aaaa', s => s + 'a').find(s => s.length > 3)).toBe('aaaa');
        expect(interval('a', 'aaaa', s => s + 'a').find('aaaaa')).toBe(null);
        expect(interval('a', undefined, s => s + 'a').find('aaa', 'aaaa')).toBe('aaa');
        expect(interval('a', 'aaaa', s => s + 'a').find(s => s.length > 3, 'aa')).toBe(null);
        expect(interval('a', 'aaaa', s => s + 'a').find('b')).toBe(null);
    });
    test("Can convert to number", () => {
        expect(interval('a', 'aaa', c => c + 'a').convert(
            s => s.length, s => s + 1,
        ).array()).toEqual([1, 2, 3])
    });
});