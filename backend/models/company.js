import { DB_TYPE } from "../config/db.js";
import CompanySQL from "./CompanySQL.js";
import CompanyMongo from "./CompanyMongo.js";

let Company;

if (DB_TYPE === "sql") {
    Company = CompanySQL;
} else if (DB_TYPE === "mongo") {
    Company = CompanyMongo;
} else {
    throw new Error("Invalid DB_TYPE in .env");
}

export default Company;
