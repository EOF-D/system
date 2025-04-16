/**
 * Server configuration settings.
 */
export const Config = {
  /**
   * Port for the server.
   * @type {number}
   * @default 3000
   */
  port: process.env.PORT || 3000,

  /**
   * When JWT tokens should expire.
   * @type {string}
   * @default "30d"
   */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",

  /**
   * Secret key for signing JWT tokens.
   * @type {string}
   * @default "secret-test-token"
   */
  jwtSecret: process.env.JWT_SECRET || "secret-test-token",
};
