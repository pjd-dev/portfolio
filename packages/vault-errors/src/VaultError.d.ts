/**
 * Base error class for all vault platform errors
 */
export declare class VaultError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: any;
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: any
  );
  toJSON(): {
    name: string;
    code: string;
    message: string;
    statusCode: number;
    details: any;
  };
}
//# sourceMappingURL=VaultError.d.ts.map
