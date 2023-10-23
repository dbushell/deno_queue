import type {Deferred} from 'https://deno.land/std@0.204.0/async/mod.ts';

export {Deferred};

export interface QueueOptions {
  /** Maximum number of active items running at once */
  concurrency?: number;
}

export interface QueueCallback<T, R> {
  (item: T): Promise<R>;
}

export interface QueueItem<T, R> {
  defer: Deferred<R>;
  callback: QueueCallback<T, R>;
}
