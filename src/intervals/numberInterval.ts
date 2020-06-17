import { Interval } from "../types";
import { createInterval } from "./generalInterval";

export const numberInterval = createInterval((a: number, b: number) => a === b, (a, b) => a < b, Infinity);