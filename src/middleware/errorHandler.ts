import type { Request, Response, NextFunction } from "express";
import { ApiError } from '../utils/apiError.js';
import { errorResponse } from '../utils/errorResponse.js';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorCode = "SERVER_ERROR";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } else {
    console.error("Unexpected error:", err);
  }

  return errorResponse(res, statusCode, message, errorCode);
};

export default errorHandler;
