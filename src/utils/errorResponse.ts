import type { Response } from "express";

export interface IErrorResponse {
  error?: string;
  message: string;
  data?: any;
  status?: number;
}

export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errorCode: string = "ERROR",
  data?: any
): Response => {
  const response: IErrorResponse = {
    error: errorCode,
    message,
  };

  if (data) {
    response.data = data;
  }

  if (statusCode >= 500) {
    response.status = statusCode;
  }

  return res.status(statusCode).json(response);
};

export const successResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
): Response => {
  const response: any = {
    message,
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};
