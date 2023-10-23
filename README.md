# 🦥 Deno Queue

Run async / promise-returning functions with limited concurrency.

## Usage

Create a new queue:

```javascript
const queue = new Queue({
  concurrency: 1
});

```

Append an item  with a callback functions:

```javascript
// Append an async function
queue.append('task one', async (name) => {
  console.log(`${name} complete`);
});
```

`append` returns a deferred promise that resolves the callback when the queued item is run. The item is passed to the callback as the first parameter.

```javascript
// Append a promise-returning function
queue
  .append('task two', (name) => {
    return Promise.resolve(`${name} complete`);
  })
  .then((message) => console.log(message));
```

Items can be any primitive type or object:

```javascript
queue.append({wait: 1000}, async (item) => {
  await new Promise((resolve) => setTimeout(resolve, item.wait));
  console.log('task three complete');
});
```

Callback errors can be handled:

```javascript
queue
  .append('catch', async () => {
    throw new Error('catch errored!');
  })
  .catch((err) => console.error(err.message));
```

Or:

```javascript
const deferred = queue.append('try/catch', async () => {
  throw new Error('try/catch errored!');
});
try {
  await deferred;
} catch (err) {
  console.error(err.message);
}

```

See `examples` for full usage.

## Notes

Inspired by [plimit](https://github.com/sindresorhus/p-limit), [p-throttle](https://github.com/sindresorhus/p-throttle), and [p-queue](https://github.com/sindresorhus/p-queue).

* * *

[MIT License](/LICENSE) | Copyright © 2023 [David Bushell](https://dbushell.com)
