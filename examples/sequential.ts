import {Queue} from '../mod.ts';

const queue = new Queue<string, number>({
  concurrency: 1
});

const wait = async (name: string) => {
  const ms = Math.floor(Math.random() * 1000);
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.log(`Item "${name}" waited ${ms}ms`);
  return ms;
};

const all = Promise.all([
  queue.append('One', wait),
  queue.append('Four', wait),
  queue.append('Five', wait),
  queue.prepend('Three', wait),
  queue.prepend('Two', wait)
]);

console.log(`Queued ${queue.length} items (${queue.concurrency} concurrent)`);

const start = Date.now();

await all;

console.log(`Total time: ${Date.now() - start}ms`);
