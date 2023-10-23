import {Queue} from '../mod.ts';

const queue = new Queue({
  concurrency: 1
});

// Append an async function
queue.append('task one', async (name) => {
  console.log(`${name} complete`);
});

// Append a promise-returning function
queue
  .append('task two', (name) => {
    return Promise.resolve(`${name} complete`);
  })
  .then((message) => console.log(message));

// Append an object
queue.append({wait: 1000}, async (item) => {
  await new Promise((resolve) => setTimeout(resolve, item.wait));
  console.log('task three complete');
});
