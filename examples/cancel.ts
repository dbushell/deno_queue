import {Queue} from '../mod.ts';

const queue = new Queue<number, void>({
  concurrency: 1,
  throttle: 10
});

for (let i = 0; i < 100; i++) {
  queue
    .append(i, (i) => {
      console.log(`${i}\tran\t(${queue.waiting} waiting)`);
    })
    .catch(() => {
      console.log(`${i}\tcancelled`);
    });
}

setTimeout(() => {
  for (let i = 0; i < 50; i += 2) {
    const cancelled = queue.cancel(i);
    if (!cancelled) {
      console.log(`${i}\talready ran`);
    }
  }
}, 100);

setTimeout(() => {
  for (let i = 0; i < 100; i += 2) {
    const cancelled = queue.cancel(i);
    if (!cancelled) {
      console.log(`${i}\talready ran (or cancelled)`);
    }
  }
}, 300);
