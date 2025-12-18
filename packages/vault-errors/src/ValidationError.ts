/**
 * Validation error class
 */

import { VaultError } from './VaultError.js';

export class ValidationError extends VaultError {
  public readonly field?: string;

  constructor(message: string, field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    this.field = field;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}
