import {Queue} from '../mod.ts';

interface Item {
  name: string;
  ms: number;
}

const queue = new Queue<Item, Item>({
  concurrency: 5
});

const random = () => Math.floor(Math.random() * 1000);

const wait = async (item: Item) => {
  await new Promise((resolve) => setTimeout(resolve, item.ms));
  return item;
};

const after = ({name, ms}: Item) => {
  console.log(`Item "${name}" waited ${ms}ms`);
};

const all = Promise.all([
  queue.append({name: 'One', ms: random()}, wait).then(after),
  queue.append({name: 'Two', ms: random()}, wait).then(after),
  queue.append({name: 'Three', ms: random()}, wait).then(after),
  queue.append({name: 'Four', ms: random()}, wait).then(after),
  queue.append({name: 'Five', ms: random()}, wait).then(after)
]);

console.log(`Queued ${queue.length} items (${queue.concurrency} concurrent)`);

const start = Date.now();

await all;

console.log(`Total time: ${Date.now() - start}ms`);
