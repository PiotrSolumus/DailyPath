export class HttpError extends Error {
  public readonly status: number;
  public readonly error: string;
  public readonly details?: Record<string, string[]>;
  public readonly code?: string;

  constructor(params: { status: number; error: string; message: string; details?: Record<string, string[]>; code?: string }) {
    super(params.message);
    this.name = "HttpError";
    this.status = params.status;
    this.error = params.error;
    this.details = params.details;
    this.code = params.code;
  }
}



