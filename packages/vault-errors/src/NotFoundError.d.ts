/**
 * Not found error class
 */
import { VaultError } from './VaultError.js';
export declare class NotFoundError extends VaultError {
  readonly resourceType?: string;
  readonly resourceId?: string;
  constructor(
    message: string,
    resourceType?: string,
    resourceId?: string,
    details?: any
  );
  toJSON(): {
    resourceType: string | undefined;
    resourceId: string | undefined;
    name: string;
    code: string;
    message: string;
    statusCode: number;
    details: any;
  };
}
//# sourceMappingURL=NotFoundError.d.ts.map
