export class PackagedPathAccessError extends Error {
  readonly title: string;

  constructor(message: string, options?: { cause?: unknown; title?: string }) {
    super(message, options);
    this.name = "PackagedPathAccessError";
    this.title = options?.title ?? "Composer Design cannot access its data folder";
  }
}
