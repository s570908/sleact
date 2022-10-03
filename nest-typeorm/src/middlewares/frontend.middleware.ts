import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import path from 'path';

@Injectable()
export class FrontendMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<any> {
    const { originalUrl } = req;
    if (originalUrl.includes('/api')) {
      next();
    } else {
      res.sendFile(
        path.join(__dirname, '..', '..', '..', 'public', 'index.html'),
      );
    }
  }
}
