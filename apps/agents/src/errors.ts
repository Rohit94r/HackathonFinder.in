/** The site doesn't allow us (robots.txt, a bot challenge or its terms). We stop instead of working around it. */
export class BlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockedError';
  }
}

/** robots.txt disallows this exact URL for our user agent. */
export class RobotsDisallowedError extends BlockedError {
  constructor(public readonly url: string) {
    super(`robots.txt disallows ${url}`);
    this.name = 'RobotsDisallowedError';
  }
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
