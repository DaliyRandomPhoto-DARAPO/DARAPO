// 로깅 유틸 함수
import { Logger } from '@nestjs/common';

export function logError(
  logger: Logger,
  message: string,
  error?: any,
  context?: string
): void {
  const errorDetails = error?.stack || error?.message || error;
  logger.error(`${message}: ${errorDetails}`, error?.stack || error, context);
}

export function logWarn(
  logger: Logger,
  message: string,
  details?: any,
  context?: string
): void {
  logger.warn(message, details, context);
}

export function logInfo(
  logger: Logger,
  message: string,
  details?: any,
  context?: string
): void {
  logger.log(message, details, context);
}
