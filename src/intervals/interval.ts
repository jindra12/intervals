import { Comparable } from "../types";
import { numberInterval } from "./numberInterval";
import { stringInterval } from "./stringInterval";
import { objectInterval } from "./objectInterval";

type AllowedTypes = string | number | symbol | Comparable | boolean;

export const interval = <T extends AllowedTypes>(start?: T, end?: T, next?: (current: T) => T) => {
    if (!start && !end && !next) {
        return numberInterval(0, Infinity, current => current++);
    }
    if (start) {
        switch (typeof start) {
            case 'bigint':
            case 'function':
                return undefined;
            case 'number':
                return numberInterval(start, (end as number) || Infinity, next as any || (current => current++));
            case 'symbol':
            case 'string':
                return stringInterval(start.toString(), (end as any) || null, next as any || (current => `${current}${current}`));
            case 'object':
                if (!next) {
                    return undefined;
                }
                return objectInterval(start as Comparable, (end as any) || null, next as any);
            case 'boolean':
                return numberInterval(start ? 1 : 0, (end as any) || 1, next as any || (_ => 1));
        }
    }

    return undefined;
}

