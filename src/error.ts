/** Error thrown for rejected `Queue` items */
export class QueueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueueError';
  }
}
