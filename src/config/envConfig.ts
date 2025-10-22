import { cleanEnv, num, str } from "envalid";

export const env = cleanEnv(process.env, {
  MYSQL_HOST: str({ default: "localhost" }),
  MYSQL_PORT: num({ default: 3306 }),
  MYSQL_DATABASE: str(),
  MYSQL_USER: str(),
  MYSQL_PASSWORD: str(),

  JWT_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_EXPIRES_IN: str(),
});
