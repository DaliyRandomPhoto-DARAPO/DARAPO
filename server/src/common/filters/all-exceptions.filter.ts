import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.status || 500;

    response.status(status).json({
      statusCode: status,
      message: status === 500 ? 'Internal server error' : exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
