# 🦥 Carriageway

Run async and promise-returning functions with limited concurrency and optional rate limiting.

## Usage

Add dependency from JSR: [@dbushell/carriageway](https://jsr.io/@dbushell/carriageway)

Deno imports from `mod.ts`. Other runtimes import from `index.min.js` (Bun, Node, web browsers). Node requires `--js-promise-withresolvers` flag.

Create a new queue:

```javascript
const queue = new Queue();
```

Append an item with a callback function:

```javascript
queue.append('task', (name) => {
  console.log(`${name} complete`);
});
```

`append` returns a deferred promise that resolves the callback when the queued item is run. The item is passed to the callback as the first parameter.

```javascript
queue
  .append('task', (name) => `${name} complete`)
  .then((message) => console.log(message));
```

Callbacks can be functions, async functions, or promise-returning functions.

Items can be anything; primitive types, objects, instances, etc.

```javascript
queue.append({wait: 1000}, async ({wait}) => {
  await new Promise((resolve) => setTimeout(resolve, wait));
  console.log(`waited ${wait}ms`);
});
```

Other feature examples:

* [Handle errors](/examples/errors.ts)
* [Sort queued items](/examples/sort.ts)
* [Throttle / rate-limit](/examples/throttle.ts)

See the `examples` directory for full usage.

## Options

The `Queue` constructor accepts an options object. Options can also be changed with the instance setter methods.

```javascript
const queue = new Queue({ concurrency: 5 });
queue.concurrency = 10;
```

### concurrency

Maximum number of active items running at once (default: 1).

### throttle

Minimum number of milliseconds between start of each item (default: 0).

## API

### append(item, callback)

Add an item and callback to the end of the queue.

### prepend(item, callback)

Add an item and callback to the start of the queue.

### has(item)

Returns true if item is queued (active or waiting).

### get(item)

Returns the deferred promise for the item.

### clear()

Empty the queue of waiting items. Deferred promises are rejected with a `QueueError`. Pending items are not cleared.

## Notes

Inspired by [plimit](https://github.com/sindresorhus/p-limit), [p-throttle](https://github.com/sindresorhus/p-throttle), and [p-queue](https://github.com/sindresorhus/p-queue).

* * *

[MIT License](/LICENSE) | Copyright © 2024 [David Bushell](https://dbushell.com)
