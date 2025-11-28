import "express";

declare module "express" {
  interface Request {
    user?: {
      userId: string;
      userName: string;
      email: string;
      profileImg: string;
    };
  }
}
