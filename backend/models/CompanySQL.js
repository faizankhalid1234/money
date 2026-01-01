import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

let CompanySQL = null;

if (sequelize) {
    CompanySQL = sequelize.define(
        "Company",
        {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            name: { type: DataTypes.STRING, allowNull: false },
            merchant_id: { type: DataTypes.STRING, unique: true },
        },
        { tableName: "companies" }
    );
}

export default CompanySQL;