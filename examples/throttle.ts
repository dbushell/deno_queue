import {Queue} from '../mod.ts';

const queue = new Queue<number, void>({
  concurrency: 10,
  throttle: 100
});

console.log('item\tms\tpending\twaiting\tthrottle');

const promises = [];
for (let i = 0; i < 100; i++) {
  promises.push(
    queue.append(i, async () => {
      const ms = Math.floor(Math.random() * 500);
      await new Promise((resolve) => setTimeout(resolve, ms));
      if (i === 50) {
        queue.throttle = 1000;
      }
      if (i === 60) {
        queue.throttle = 0;
      }
      console.log(
        `i: ${String(i).padStart(2, ' ')}\t`,
        `ms ${String(ms).padStart(3, ' ')}\t`,
        `p: ${queue.pending}\t`,
        `w: ${queue.waiting}\t`,
        `t: ${queue.throttle}`
      );
    })
  );
}

const start = Date.now();

await Promise.all(promises);

console.log(`\nTotal time: ${Date.now() - start}ms`);

console.log(`Average time: ${(Date.now() - start) / promises.length}ms`);
