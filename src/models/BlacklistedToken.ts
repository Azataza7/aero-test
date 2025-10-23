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
  public id!: number;
  public token!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "blacklisted_tokens",
    timestamps: false,
  }
);
