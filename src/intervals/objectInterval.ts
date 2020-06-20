import { createInterval, Comparable } from "./generalInterval";

export const objectInterval = createInterval(<T extends Comparable>(a: T, b: T) => a.equals(b), (a, b) => a.isLessThan(b), null);