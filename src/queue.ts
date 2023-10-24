import {delay as asyncDelay} from 'https://deno.land/std@0.204.0/async/delay.ts';
import {deferred as asyncDeferred} from 'https://deno.land/std@0.204.0/async/deferred.ts';
import type {QueueCallback, QueueItem, QueueOptions, IQueue} from './types.ts';

export class QueueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueueError';
  }
}

export class Queue<T, R> implements IQueue<T, R> {
  #concurrency!: number;
  #throttle!: number;
  #head: QueueItem<T, R> | undefined;
  #tail: QueueItem<T, R> | undefined;
  #size = 0;
  #runMap: Map<T, QueueItem<T, R>> = new Map();
  #runQueue: Queue<number, void> | undefined;
  #runCount = 0;
  #runTime = 0;

  constructor(options?: QueueOptions) {
    this.concurrency = options?.concurrency ?? 1;
    this.throttle = options?.throttle ?? 0;

    if (this.#throttle && this.#concurrency > 1) {
      this.#runQueue = new Queue({
        throttle: this.#throttle,
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
    if (this.#runQueue) {
      return this.#runQueue.throttle;
    }
    return this.#throttle;
  }

  set throttle(value: number) {
    if (this.#runQueue) {
      this.#runQueue.throttle = value;
      return;
    }
    this.#throttle = Math.max(value, 0);
  }

  get pending(): number {
    return this.#runMap.size;
  }

  get waiting(): number {
    return this.#size;
  }

  get length(): number {
    return this.pending + this.waiting;
  }

  has(item: T): boolean {
    for (const node of this.#nodes()) {
      if (node.item === item) {
        return true;
      }
    }
    return false;
  }

  get(item: T): Promise<R> | undefined {
    if (this.#runMap.has(item)) {
      return this.#runMap.get(item)!.deferred;
    }
    for (const node of this.#nodes()) {
      if (node.item === item) {
        return node.deferred;
      }
    }
  }

  /** Return active items */
  getPending(): Array<T> {
    return Array.from(this.#runMap.keys());
  }

  /** Return queued items */
  getWaiting(): Array<T> {
    return Array.from(this.#nodes()).map((node) => node.item);
  }

  /** Add an item to the queue */
  add(item: T, callback: QueueCallback<T, R>, prepend = false): Promise<R> {
    // Return existing deferred promise
    const queued = this.get(item);
    if (queued) return queued;
    // Queue item with a deferred promise
    const deferred = asyncDeferred<R>();
    const node: QueueItem<T, R> = {
      item,
      deferred,
      callback
    };
    if (!this.#size) {
      this.#head = node;
      this.#tail = node;
    } else if (prepend) {
      node.next = this.#head;
      this.#head = node;
    } else {
      this.#tail!.next = node;
      this.#tail = node;
    }
    this.#size++;
    this.#next();
    return deferred;
  }

  append(item: T, callback: QueueCallback<T, R>): Promise<R> {
    return this.add(item, callback);
  }

  prepend(item: T, callback: QueueCallback<T, R>): Promise<R> {
    return this.add(item, callback, true);
  }

  sort(compare: (a: T, b: T) => number): void {
    const nodes = Array.from(this.#nodes());
    nodes.sort((a, b) => compare(a.item, b.item));
    this.#head = undefined;
    this.#size = nodes.length;
    for (const node of nodes) {
      node.next = undefined;
      if (this.#head) {
        this.#tail!.next = node;
        this.#tail = node;
        continue;
      }
      this.#head = node;
      this.#tail = node;
    }
  }

  clear(): void {
    this.#runQueue?.clear();
    for (const node of this.#nodes()) {
      node.deferred.reject(new QueueError('Queue cleared'));
    }
    this.#head = undefined;
    this.#tail = undefined;
    this.#size = 0;
  }

  *#nodes(): Generator<QueueItem<T, R>> {
    let node = this.#head;
    while (node) {
      yield node;
      node = node.next;
    }
  }

  #next(): void {
    // Queue is empty
    if (!this.waiting) return;
    // Limit concurrent active items
    if (this.pending >= this.#concurrency) return;
    // Move item from queue to active
    const node = this.#head!;
    this.#head = node?.next;
    this.#size--;
    this.#runMap.set(node.item, node);
    // Throttle or run immediately
    const run = () => this.#run(node.item, node);
    if (this.#runQueue) {
      // Add to throttle queue and bubble up errors
      this.#runQueue
        .append(this.#runCount++, run)
        .catch((err) => node.deferred.reject(err));
    } else {
      run();
    }
    this.#next();
  }

  async #run(item: T, {deferred, callback}: QueueItem<T, R>): Promise<void> {
    // Apply rate limit with delay
    if (this.#throttle) {
      const elapsed = performance.now() - this.#runTime;
      if (elapsed < this.#throttle) {
        await asyncDelay(this.#throttle - elapsed);
      }
      this.#runTime = performance.now();
    }
    // Execute item callback
    Promise.resolve(callback(item))
      .then(deferred.resolve)
      .catch(deferred.reject)
      // Remove active item when done
      .finally(() => {
        this.#runMap.delete(item);
        this.#next();
      });
  }
}
