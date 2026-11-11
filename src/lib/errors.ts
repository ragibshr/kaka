export class KakaError extends Error {
  status: number;
  bodySnippet?: string;
  provider?: string;

  constructor(opts: { status: number; message: string; bodySnippet?: string; provider?: string }) {
    super(opts.message);
    this.name = 'KakaError';
    this.status = opts.status;
    this.bodySnippet = opts.bodySnippet;
    this.provider = opts.provider;
  }
}

export class AllProvidersFailedError extends Error {
  errors: { provider: string; error: KakaError }[];

  constructor(errors: { provider: string; error: KakaError }[]) {
    super('All AI providers failed');
    this.name = 'AllProvidersFailedError';
    this.errors = errors;
  }
}
