import { DataTypes, Model, type Optional } from "sequelize";
import { sequelize } from "../config/database";

interface BlacklistedTokenAttributes {
  id: number;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
}

interface BlacklistedTokenCreationAttributes
  extends Optional<BlacklistedTokenAttributes, "id" | "createdAt"> {}

export class BlacklistedToken
  extends Model<BlacklistedTokenAttributes, BlacklistedTokenCreationAttributes>
  implements BlacklistedTokenAttributes
{
  declare id: number;
  declare token: string;
  declare expiresAt: Date;
  declare readonly createdAt: Date;
}

BlacklistedToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "blacklisted_tokens",
    timestamps: true,
    createdAt: "created_at", // Map to snake_case column
    updatedAt: false, // We don't need updatedAt
  }
);