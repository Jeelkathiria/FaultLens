const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

/**
 * Role-Based Access Control middleware
 * @param {string[]} allowedRoles - Array of roles allowed e.g. ['ADMIN'] or ['DEVELOPER', 'ADMIN']
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`));
    }

    next();
  };
}

module.exports = {
  requireRole
};
