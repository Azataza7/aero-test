import { DataTypes, Model } from "sequelize";
import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from "sequelize";
import { User } from "./User";
import { sequelize } from "../config/database.ts";

export class File extends Model<
  InferAttributes<File>,
  InferCreationAttributes<File>
> {
  declare id: CreationOptional<number>;
  declare userId: string;
  declare filename: string;
  declare originalName: string;
  declare extension: string;
  declare mimeType: string;
  declare size: number;
  declare uploadDate: CreationOptional<Date>;

  // связь
  declare user?: User;

  getReadableSize(): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (this.size === 0) return "0 Byte";
    const i = Math.floor(Math.log(this.size) / Math.log(1024));
    return Math.round((this.size / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }
}

File.init(
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
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "original_name",
    },
    extension: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "mime_type",
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    uploadDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "upload_date",
    },
  },
  {
    sequelize,
    tableName: "files",
    timestamps: false,
    indexes: [
      { name: "files_user_id_idx", fields: ["user_id"] },
      { name: "files_upload_date_idx", fields: ["upload_date"] },
    ],
  }
);

// связь с User
File.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
});
User.hasMany(File, {
  foreignKey: "userId",
  as: "files",
});
