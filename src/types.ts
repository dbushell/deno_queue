import type {Deferred} from 'https://deno.land/std@0.204.0/async/mod.ts';

export type QueueDeferred<R> = Deferred<R>;

export type QueueCallback<T, R> = (item: T) => R | Promise<R>;

export interface QueueItem<T, R> {
  item: T;
  deferred: QueueDeferred<R>;
  callback: QueueCallback<T, R>;
  next?: QueueItem<T, R>;
}

export interface QueueOptions {
  /** Maximum number of active items running at once */
  concurrency?: number;
  /** Minimum number of milliseconds between start of each item */
  throttle?: number;
}
