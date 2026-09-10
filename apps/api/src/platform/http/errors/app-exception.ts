import { HttpException } from '@nestjs/common';
import { FieldError } from './field-error.js';

export type AppExceptionOptions = {
  status: number;
  code: string;
  title: string;
  detail?: string;
  errors?: FieldError[];
};

export class AppException extends HttpException {
  readonly code: string;
  readonly title: string;
  readonly safeDetail?: string;
  readonly fieldErrors?: FieldError[];

  constructor(options: AppExceptionOptions) {
    super(options.title, options.status);
    this.code = options.code;
    this.title = options.title;
    this.safeDetail = options.detail;
    this.fieldErrors = options.errors;
  }
}
