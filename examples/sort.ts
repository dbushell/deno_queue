import {Queue} from '../mod.ts';

const queue = new Queue<number, number>({
  concurrency: 1
});

const wait = async (n: number) => {
  const ms = Math.floor(Math.random() * 1000);
  await new Promise((resolve) => setTimeout(resolve, ms));
  // Reverse order halfway through
  if (n === 4) {
    queue.sort((a, b) => b - a);
  }
  console.log(`Item "${n}" waited ${ms}ms`);

  return ms;
};

const promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(queue.add(i, wait));
}

const start = Date.now();

await Promise.all(promises);

console.log(`\nTotal time: ${Date.now() - start}ms`);
