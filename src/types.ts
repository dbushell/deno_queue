/**
 * @module
 * Types for `jsr:@dbushell/carriageway`
 */
/** Queue item deferred promise */
export type QueueDeferred<T> = ReturnType<typeof Promise.withResolvers<T>>;

/** Queue item callback function */
export type QueueCallback<T, R> = (item: T) => R | Promise<R>;

/** Queue item (used internally) */
export interface QueueItem<T, R> {
  item: T;
  deferred: QueueDeferred<R>;
  callback: QueueCallback<T, R>;
  next?: QueueItem<T, R>;
}

/** Init options for Queue class */
export interface QueueOptions {
  /** Maximum number of active items running at once */
  concurrency?: number;
  /** Minimum number of milliseconds between start of each item */
  throttle?: number;
}

/** Interface for Queue class */
export interface IQueue<T, R> {
  /** Number of active items running now */
  readonly pending: number;
  /** Number of queued items waiting to run */
  readonly waiting: number;
  /** Total number of active and queued items */
  readonly length: number;
  /** Maximum number of active items running at once */
  concurrency: number;
  /** Minimum number of milliseconds between start of each item */
  throttle: number;
  /** Returns true if item is queued (active or waiting) */
  has(item: T): boolean;
  /** Returns the deferred promise for the item */
  get(item: T): Promise<R> | undefined;
  /** Append an item to the queue */
  append(item: T, callback: QueueCallback<T, R>): Promise<R>;
  /** Prepend an item to the queue */
  prepend(item: T, callback: QueueCallback<T, R>): Promise<R>;
  /** Prioritize the order of queued items */
  sort(compare: (a: T, b: T) => number): void;
  /** Clear the queue */
  clear(): void;
}
