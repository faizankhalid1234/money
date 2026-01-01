import { DB_TYPE } from "../config/db.js";
import PaymentSQL from "./PaymentSQL.js";
import PaymentMongo from "./PaymentMongo.js";

let Payment;

if (DB_TYPE === "sql") {
    Payment = PaymentSQL;
} else if (DB_TYPE === "mongo") {
    Payment = PaymentMongo;
} else {
    throw new Error("Invalid DB_TYPE in .env");
}

export default Payment;
