import {delay, deferred} from 'https://deno.land/std@0.204.0/async/mod.ts';
import type {QueueItem, QueueOptions, QueueCallback} from './types.ts';

export class Queue<T, R> {
  #pending: Map<T, QueueItem<T, R>> = new Map();
  #queue: Map<T, QueueItem<T, R>> = new Map();
  #concurrency!: number;
  #throttle!: number;
  #throttleId = 0;
  #throttleLast = 0;
  #throttleQueue: Queue<number, void> | undefined;

  constructor(options?: QueueOptions) {
    this.concurrency = options?.concurrency ?? 1;
    this.throttle = options?.throttle ?? 0;
    // Use internal queue to apply throttle
    if (this.throttle && this.concurrency > 1) {
      this.#throttleQueue = new Queue({
        throttle: this.throttle,
        concurrency: 1
      });
      this.#throttle = 0;
    }
  }

  get concurrency(): number {
    return this.#concurrency;
  }

  set concurrency(value: number) {
    this.#concurrency = Math.max(value, 1);
  }

  get throttle(): number {
    if (this.#throttleQueue) {
      return this.#throttleQueue.throttle;
    }
    return this.#throttle;
  }

  set throttle(value: number) {
    if (this.#throttleQueue) {
      this.#throttleQueue.throttle = value;
      return;
    }
    this.#throttle = Math.max(value, 0);
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
    const [item, queueItem]: [T, QueueItem<T, R>] = next;
    // Move item from queue to active
    this.#queue.delete(item);
    this.#pending.set(item, queueItem);
    // Throttle or run immediately
    const run = () => this.#run(item, queueItem);
    if (this.#throttleQueue) {
      this.#throttleQueue.append(this.#throttleId++, run);
    } else {
      run();
    }
    this.#next();
  }

  async #run(item: T, {defer, callback}: QueueItem<T, R>): Promise<void> {
    // Apply rate limit throttle
    if (this.throttle) {
      const elapsed = Date.now() - this.#throttleLast;
      if (elapsed < this.throttle) {
        await delay(this.throttle - elapsed);
      }
    }
    this.#throttleLast = Date.now();
    // Execute item callback
    callback(item)
      .then(defer.resolve)
      .catch(defer.reject)
      // Remove active item when done
      .finally(() => {
        this.#pending.delete(item);
        this.#next();
      });
  }
}
