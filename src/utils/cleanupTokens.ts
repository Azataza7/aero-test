import { Op } from "sequelize";
import { BlacklistedToken } from "../models/BlacklistedToken";
import { RefreshToken } from "../models/RefreshToken";

export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    const now = new Date();

    await BlacklistedToken.destroy({
      where: {
        expiresAt: {
          [Op.lt]: now,
        },
      },
    });

    await RefreshToken.destroy({
      where: {
        expiresAt: {
          [Op.lt]: now,
        },
      },
    });

    console.log("Expired tokens cleaned up");
  } catch (error) {
    console.error("Error cleaning up tokens:", error);
  }
};

export const startTokenCleanupScheduler = (): void => {
  setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);
};
