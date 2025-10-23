import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { logger } from "./src/utils/logger.ts";
import { setupSwagger } from "./src/config/swagger.ts";
import type { Request, Response } from "express";
import { dbConnection } from "./src/config/database.ts";
import AuthRouter from "./src/routes/authRoutes.ts";
import FileRouter from "./src/routes/fileRoutes.ts";
import { startTokenCleanupScheduler } from "./src/utils/cleanupTokens.ts";

config();

const app = express();
const PORT = 3000;

app.use(logger);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/file", FileRouter);

app.get("/health", (req: Request, res: Response) => {
  res.send({ status: "OK", message: "Server is running" });
});

setupSwagger(app);

const run = async () => {
  await dbConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startTokenCleanupScheduler();

void run();
