import { DataTypes, Model } from "sequelize";
import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

export class RefreshToken extends Model<
  InferAttributes<RefreshToken>,
  InferCreationAttributes<RefreshToken>
> {
  declare id: CreationOptional<number>;
  declare userId: string;
  declare token: string;
  declare deviceId: string; // для поддержки нескольких устройств
  declare expiresAt: Date;
  declare createdAt: CreationOptional<Date>;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "user_id",
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    deviceId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "device_id",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
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
    tableName: "refresh_tokens",
    timestamps: false,
    indexes: [
      { name: "refresh_tokens_user_id_idx", fields: ["user_id"] },
      { name: "refresh_tokens_token_idx", fields: ["token"] },
      { name: "refresh_tokens_device_id_idx", fields: ["device_id"] },
    ],
  }
);
