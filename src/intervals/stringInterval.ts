import { createInterval } from "./generalInterval";

export const stringInterval = createInterval((a: string, b: string) => a === b, (a, b) => a < b, null);