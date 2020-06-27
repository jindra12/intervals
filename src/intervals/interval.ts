import { Comparable, AllowedTypes, IntervalType } from "../types";
import { numberInterval } from "./numberInterval";
import { stringInterval } from "./stringInterval";
import { objectInterval } from "./objectInterval";
import { dateInterval } from "./dateInterval";

export const interval = <T extends AllowedTypes = number>(start?: T, end?: T, next?: (current: T) => T): IntervalType<T> => {
    if (!start && !end && !next) {
        return numberInterval(0, Infinity, current => current + 1) as any;
    }
    if (start || start === 0) {
        switch (typeof start) {
            case 'bigint':
            case 'function':
                throw Error('Function or bigint are not correct types for interval');
            case 'number':
                return numberInterval(start, (end as number) || Infinity, next as any || (current => current + 1)) as any;
            case 'symbol':
            case 'string':
                return stringInterval(start.toString(), (end as any) || null, next as any || (current => `${current}${current}`)) as any;
            case 'object':
                if (start instanceof Date) {
                    return dateInterval(start, (end as any) || null, next as any || (current => new Date(current.getTime() + 1))) as any;
                }
                if (!next) {
                    throw Error('Cannot create non-date object interval without knowing how to generate next item');
                }
                return objectInterval(start as Comparable<any>, (end as any) || null, next as any) as any;
            case 'boolean':
                return numberInterval(start as number, (end as any) || true, next as any || (_ => true)) as any;
        }
    }

    throw Error('Unable to determine what interval to create');
}

