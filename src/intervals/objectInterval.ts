import { createInterval } from "./generalInterval";
import { InnerComparable } from "../types";

export const objectInterval = createInterval(<T extends InnerComparable>(a: T, b: T) => a.equals(b), (a, b) => a.isLessThan(b), null);