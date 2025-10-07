const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const errorResponse = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const validationError = (res, errors) => {
  return errorResponse(res, 'Validation failed', 400, errors);
};

const notFoundError = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, 404);
};

const unauthorizedError = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

const forbiddenError = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

module.exports = {
  successResponse,
  errorResponse,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError
};