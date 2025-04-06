// Configure the server.
export const Config = {
  port: process.env.PORT || 3000,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
  jwtSecret: process.env.JWT_SECRET || "secret-test-token",
};
