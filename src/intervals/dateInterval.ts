import { createInterval } from "./generalInterval";

export const dateInterval = createInterval((a: Date, b: Date) => a.getTime() === b.getTime(), (a, b) => a.getTime() < b.getTime(), null);