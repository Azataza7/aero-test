import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { type Express } from "express";
import path from "path";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Aero API",
      version: "1.0.0",
      description: "Документация API для создания организации клиента",
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
  },
  apis: [path.join(__dirname, "./src/routes/*.ts")],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
