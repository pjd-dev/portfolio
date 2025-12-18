/**
 * Base error class for all vault platform errors
 */

export class VaultError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'VaultError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain proper prototype chain in TypeScript/JavaScript
    Object.setPrototypeOf(this, VaultError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
