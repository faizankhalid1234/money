import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const DB_TYPE = process.env.DB_TYPE || "mongo";

let sequelize = null;

if (DB_TYPE === "sql") {
    sequelize = new Sequelize(
        process.env.SQL_DATABASE,
        process.env.SQL_USER,
        process.env.SQL_PASSWORD,
        {
            host: process.env.SQL_HOST,
            dialect: "mysql",
            logging: false,
        }
    );
}

export { sequelize };