import { createInterval } from "./generalInterval";

export interface Comparable {
    equals: <T extends Comparable>(item: T) => boolean;
    isLessThan: <T extends Comparable>(item: T) => boolean;
}

export const objectInterval = createInterval(<T extends Comparable>(a: T, b: T) => a.equals(b), (a, b) => a.isLessThan(b), null);