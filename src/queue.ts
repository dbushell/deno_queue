import {deferred} from 'https://deno.land/std@0.204.0/async/mod.ts';
import type {QueueItem, QueueOptions, QueueCallback} from './types.ts';

export class Queue<T, R> {
  #concurrency: number;
  #pending: Map<T, QueueItem<T, R>>;
  #queue: Map<T, QueueItem<T, R>>;

  constructor(options?: QueueOptions) {
    this.#concurrency = Math.max(options?.concurrency ?? 1, 1);
    this.#pending = new Map();
    this.#queue = new Map();
  }

  /** Maximum number of active items */
  get concurrency(): number {
    return this.#concurrency;
  }

  /** Number of active items running now */
  get pending(): number {
    return this.#pending.size;
  }

  /** Number of queued items waiting to run */
  get size(): number {
    return this.#queue.size;
  }

  /** Total number of active and queued items */
  get length(): number {
    return this.pending + this.size;
  }

  /** Return true if item is active or queued */
  has(item: T): boolean {
    return this.#pending.has(item) || this.#queue.has(item);
  }

  /** Return a deferred promise for the item */
  get(item: T): Promise<R> | undefined {
    if (this.#pending.has(item)) {
      return this.#pending.get(item)!.defer;
    }
    if (this.#queue.has(item)) {
      return this.#queue.get(item)!.defer;
    }
  }

  /** Return active items */
  getPending(): Array<T> {
    return Array.from(this.#pending.keys());
  }

  /** Return queued items */
  getQueued(): Array<T> {
    return Array.from(this.#queue.keys());
  }

  /** Prioritize the order of queued items */
  sort(compare: (a: T, b: T) => number): void {
    const queue = Array.from(this.#queue.entries());
    queue.sort((a, b) => compare(a[0], b[0]));
    this.#queue = new Map(queue);
  }

  /**
   * Add an item to the queue
   * @param item - Unique key or object to queue
   * @param callback - Function to execute when item is active
   * @returns A deferred promise that resolves the callback function
   */
  append(item: T, callback: QueueCallback<T, R>): Promise<R> {
    // Return existing deferred promise
    const queued = this.get(item);
    if (queued) return queued;
    // Queue item with a deferred promise
    const defer = deferred<R>();
    this.#queue.set(item, {
      defer,
      callback
    });
    this.#next();
    return defer;
  }

  #next(): void {
    // Queue is empty
    if (this.size < 1) {
      return;
    }
    // Limit concurrency active items
    if (this.pending >= this.concurrency) {
      return;
    }
    const next = this.#queue.entries().next().value;
    const [item, {defer, callback}]: [T, QueueItem<T, R>] = next;
    // Move item from queue to active
    this.#queue.delete(item);
    this.#pending.set(item, {defer, callback});
    // Execute item callback
    callback(item)
      .then(defer.resolve)
      .catch(defer.reject)
      // Remove active item when done
      .finally(() => {
        this.#pending.delete(item);
        this.#next();
      });
    this.#next();
  }
}
