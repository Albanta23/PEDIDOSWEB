const rateLimit = require('express-rate-limit');

// General limiter for most state-changing API calls
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.' }
});

// Stricter limiter for bulk operations
const bulkOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs (adjust as needed for your use case)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas operaciones masivas, por favor intente de nuevo más tarde.' }
});

module.exports = {
  defaultLimiter,
  bulkOperationLimiter,
};
