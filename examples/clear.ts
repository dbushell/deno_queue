import {Queue} from '../mod.ts';

const queue = new Queue<number, void>({
  concurrency: 10,
  throttle: 100
});

let promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(
    queue
      .append(i, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        console.log(`${i} was called`);
        if (i === 4) {
          queue.clear();
        }
      })
      .then(() => {
        console.log(`${i} was resolved`);
      })
      .catch((err) => {
        console.log(`${i} was rejected (${err.message})`);
      })
  );
}

await Promise.all(promises);
promises = [];

for (let i = 10; i < 15; i++) {
  promises.push(
    queue
      .append(i, () => {})
      .then(() => {
        console.log(`${i} was resolved`);
      })
  );
}
