import {Queue} from '../mod.ts';

const queue = new Queue<string, void>({
  concurrency: 1
});

// Catch an error
queue
  .append('catch', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    throw new Error('catch errored!');
  })
  .catch((err) => console.error(err.message));

// Alternate error handling
const deferred = queue.append('try/catch', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  throw new Error('try/catch errored!');
});
try {
  await deferred;
} catch (err) {
  console.error(err.message);
}
