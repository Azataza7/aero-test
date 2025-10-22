import chalk from "chalk";
import type { NextFunction, Request, Response } from "express";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    const method = chalk.cyan(req.method);
    const url = chalk.yellow(req.originalUrl);

    const statusColor =
      res.statusCode < 300
        ? chalk.green
        : res.statusCode < 400
          ? chalk.cyan
          : res.statusCode < 500
            ? chalk.red
            : chalk.bgRed.white;

    const status = statusColor(res.statusCode);
    const time = chalk.magenta(`${duration}ms`);

    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]!.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    console.log(
      `[${new Date().toISOString()}] ${ip} ${method} ${url} ${status} - ${time}`
    );
  });

  next();
};
