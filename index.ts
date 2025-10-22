import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { logger } from "./src/utils/logger.ts";
import { setupSwagger } from "./src/config/swagger.ts";
import type { Request, Response } from "express";
import { dbConnection, sequelize } from "./src/config/database.ts";

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

app.get("/health", (req: Request, res: Response) => {
  res.send({ status: "OK", message: "Server is running" });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

setupSwagger(app);

const run = async () => {
  await dbConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

void run();
