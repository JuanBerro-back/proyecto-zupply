import app from "./app";
import { logger } from "./lib/logger";

// Si process.env["PORT"] no existe, usamos "10000" por defecto
const rawPort = process.env["PORT"] || "10000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
