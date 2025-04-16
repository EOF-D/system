import winston from "winston";

const { combine, timestamp, printf } = winston.format;

/**
 * Logger to use for the server.
 * @type {winston.Logger}
 */
export const logger: winston.Logger = winston.createLogger({
  format: combine(
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [new winston.transports.Console()],
});
