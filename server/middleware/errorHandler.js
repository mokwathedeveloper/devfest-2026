/**
 * Central error handling so every failure is a JSON body shaped { error, details? }.
 * Controllers throw HttpError (utils/errors.js) for expected problems; anything else becomes a generic 500
 * (the real error is logged on the server only, never leaked to the client).
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Internal server error.' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}
