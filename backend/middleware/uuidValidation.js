import { UuidService } from '../services/UuidService.js';
import { APIError } from './errorHandling.js';

export const validateUuid = (paramName = 'uuid') => {
  return (req, res, next) => {
    const uuid = req.params[paramName] || req.body[paramName] || req.query[paramName];
    
    if (!uuid) {
      return next(new APIError(`${paramName} is required`, 400));
    }

    if (!UuidService.validate(uuid)) {
      return next(new APIError(`Invalid ${paramName} format`, 400));
    }

    // Optional: Add additional checks like UUID version, timestamp, etc.
    next();
  };
};

export const validateMultipleUuids = (uuidFields) => {
  return (req, res, next) => {
    for (const field of uuidFields) {
      const uuid = req.params[field] || req.body[field] || req.query[field];
      
      if (!uuid) {
        return next(new APIError(`${field} is required`, 400));
      }

      if (!UuidService.validate(uuid)) {
        return next(new APIError(`Invalid ${field} format`, 400));
      }
    }

    next();
  };
};

// Example usage in routes:
// router.post('/game', validateMultipleUuids(['userId', 'gameId']), gameController)
