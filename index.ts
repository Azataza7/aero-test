import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { logger } from "./logger";
import { setupSwagger } from "./swagger.ts";

config();

const app = express();
const PORT = 8000;

app.use(logger);
app.use(cors());

app.use(express.json());

setupSwagger(app);

const run = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

void run();
