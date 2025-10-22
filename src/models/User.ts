import { DataTypes, Model, type InferCreationAttributes, type InferAttributes } from "sequelize";
import { sequelize } from "../config/database.ts";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: string;
  declare password: string;
  declare created_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        isEmailOrPhone(value: string) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const phoneRegex = /^\+?[1-9]\d{1,14}$/;
          if (!emailRegex.test(value) && !phoneRegex.test(value)) {
            throw new Error("ID must be a valid email or phone number");
          }
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);
