/**
 * Validation error class
 */
import { VaultError } from './VaultError.js';
export declare class ValidationError extends VaultError {
  readonly field?: string;
  constructor(message: string, field?: string, details?: any);
  toJSON(): {
    field: string | undefined;
    name: string;
    code: string;
    message: string;
    statusCode: number;
    details: any;
  };
}
//# sourceMappingURL=ValidationError.d.ts.map
