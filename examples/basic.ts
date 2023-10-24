import {Queue} from '../mod.ts';

// deno-lint-ignore no-explicit-any
const queue = new Queue<any, any>({
  concurrency: 1
});

// Append an function
queue.append('task one', (name) => {
  console.log(`${name} complete`);
});

// Use the returned promise
queue
  .append('task two', (name) => `${name} complete`)
  .then((message) => console.log(message));

// Append a promise-returning function
queue
  .append('task three', (name) => Promise.resolve(`${name} complete`))
  .then((message) => console.log(message));

// Append an object
queue.append({wait: 1000}, async ({wait}) => {
  await new Promise((resolve) => setTimeout(resolve, wait));
  console.log(`waited ${wait}ms`);
});
