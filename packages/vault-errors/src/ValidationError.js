/**
 * Validation error class
 */
import { VaultError } from './VaultError.js';
export class ValidationError extends VaultError {
  field;
  constructor(message, field, details) {
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
//# sourceMappingURL=ValidationError.js.map
