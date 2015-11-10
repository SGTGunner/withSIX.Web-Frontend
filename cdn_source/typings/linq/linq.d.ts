declare module 'linq4es2015/linq' {
    export default class Linq {
        static setExtensions(): void;
        static repeat<T>(element: T, count: number): Enumerable<T>;
        static range(start: number, count: number): Enumerable<number>;
        static empty<T>(): Enumerable<T>;
        static asEnumerable<T>(source: T[]): Enumerable<T>;

        static aggregate(): any;
        static all(): any;
        static any(): any;
        static average(): any;
        static concat(): any;
        static contains(): any;
        static count(): any;
        static defaultIfEmpty(): any;
        static distinct(): any;
        static elementAt(): any;
        static elementAtOrDefault(): any;
        static except(): any;
        static first(): any;
        static firstOrDefault(): any;
        static groupBy(): any;
        static groupJoin(): any;
        static intersect(): any;
        static join(): any;
        static last(): any;
        static lastOrDefault(): any;
        static max(): any;
        static min(): any;
        static orderBy(): any;
        static orderByDescending(): any;
        static reverse(): any;
        static select(): any;
        static selectMany(): any;
        static sequenceEqual(): any;
        static single(): any;
        static singleOrDefault(): any;
        static skip(): any;
        static skipWhile(): any;
        static sortBy(): any;
        static sum(): any;
        static take(): any;
        static takeWhile(): any;
        static thenBy(): any;
        static thenByDescending(): any;
        static toArray(): any;
        static toLookup(): any;
        static union(): any;
        static where(): any;
        static zip(): any;
    }
}

interface Enumerable<T> {
    all(predicate: (x: T) => boolean): boolean;
    any(predicate?: (x: T) => boolean): boolean;
    contains(value, comparer?: (a, b) => boolean): boolean;

    concat(enumerable: Enumerable<T>): Enumerable<T>;
    except(other: T[], comparer?: (a, b) => boolean): Enumerable<T>;
    groupBy<TKey,TElement>(keySelector: (x: T) => TKey, elementSelector: (x: T) => TElement) : Enumerable<{key: TKey, elements: TElement[]}>;
    groupBy<TKey,TElement, TResult>(keySelector: (x: T) => TKey, elementSelector: (x: T) => TElement, resultSelector: (key: TKey, elements: TElement[]) => TResult, comparer?: (a, b) => boolean) : Enumerable<TResult>; //  | {key: TKey, elements: TElement[]}
    orderBy(keySelectors: any, comparer?: (a, b) => number): OrderedEnumerable<T>;
    orderByDescending(keySelectors: any, comparer?: (a, b) => number): OrderedEnumerable<T>;
    reverse(): Enumerable<T>;
    select<T2>(transformation: (x: T) => T2): Enumerable<T2>;
    selectMany<T2>(collectionSelector: (c: Enumerable<T>) => T2, resultSelector?): Enumerable<T2>;
    skip(count: number): Enumerable<T>;
    skipWhile(predicate: (x: T) => boolean): Enumerable<T>;
    take(count: number): Enumerable<T>;
    takeWhile(predicate: (x: T) => boolean): Enumerable<T>;
    where(predicate: (x: T) => boolean): Enumerable<T>;

    toArray(): T[];

    aggregate(seed: T, func: (aggregated: T, next: T) => T): T;
    aggregate<T2>(seed: T, func: (aggregated: T, next: T) => T, resultSelector?: (x: T) => T2): T2;
    sum(): T;
    sum<T2>(selector: (x: T) => T2) : T2;

    first(predicate?: (x: T) => boolean): T;
    firstOrDefault(predicate?: (x: T) => boolean): T;
    last(predicate?: (x: T) => boolean): T;
    lastOrDefault(predicate?: (x: T) => boolean): T;
    single(predicate?: (x: T) => boolean): T;
    singleOrDefault(predicate?: (x: T) => boolean): T;
}

interface OrderedEnumerable<T> extends Enumerable<T> {
    thenBy(keySelectors: any, comparer?: (a, b) => number): OrderedEnumerable<T>;
    thenByDescending(keySelectors: any, comparer?: (a, b) => number): OrderedEnumerable<T>;
}

interface Array<T> {
    asEnumerable(): Enumerable<T>;
}
interface String {
    asEnumerable(): Enumerable<string>;
}
