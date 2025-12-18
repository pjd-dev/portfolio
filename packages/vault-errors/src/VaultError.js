/**
 * Base error class for all vault platform errors
 */
export class VaultError extends Error {
  code;
  statusCode;
  details;
  constructor(message, code, statusCode = 500, details) {
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
//# sourceMappingURL=VaultError.js.map
