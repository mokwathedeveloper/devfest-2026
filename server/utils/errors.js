/** HttpError carries an HTTP status so controllers can `throw badRequest(...)` / notFound / conflict. */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const notFound = (msg) => new HttpError(404, msg);
export const conflict = (msg, details) => new HttpError(409, msg, details);
