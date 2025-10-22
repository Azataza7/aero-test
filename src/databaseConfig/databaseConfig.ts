import { cleanEnv, num, str } from "envalid";
import { Sequelize } from "sequelize";

export const env = cleanEnv(process.env, {
  MYSQL_HOST: str({ default: "localhost" }),
  MYSQL_PORT: num({ default: 3306 }),
  MYSQL_DATABASE: str(),
  MYSQL_USER: str(),
  MYSQL_PASSWORD: str(),
});

export const sequelize = new Sequelize(
  env.MYSQL_DATABASE,
  env.MYSQL_USER,
  env.MYSQL_PASSWORD,
  {
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development",
  }
);
