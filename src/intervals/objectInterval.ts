import { createInterval } from "./generalInterval";

export const objectInterval = <T>(compare: (a: T, b: T) => number) => createInterval((a: T, b: T) => !compare(a, b), (a, b) => compare(a, b) < 0, null);