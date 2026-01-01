import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import CompanySQL from "./CompanySQL.js";

let PaymentSQL = null;

if (sequelize) {
  PaymentSQL = sequelize.define("Payment", {
    // Primary Key define karna achi practice hai
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyId: {
      type: DataTypes.INTEGER,
      references: { model: 'companies', key: "id" } // String name use karein circular dependency se bachne ke liye
    },
    merchant_id: { type: DataTypes.STRING, allowNull: false },
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    email: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    fee: DataTypes.FLOAT,
    feePercentage: DataTypes.FLOAT,
    netAmount: DataTypes.FLOAT,
    cardNumber: DataTypes.STRING,
    cardCVV: DataTypes.STRING,
    reference: { type: DataTypes.STRING, unique: true }, // Reference hamesha unique hona chahiye
    orderid: DataTypes.STRING,
    status: DataTypes.STRING,
  }, {
    tableName: "payments",
    timestamps: true
  });

  // Relationships ko yahan check karein
  if (CompanySQL && PaymentSQL) {
    CompanySQL.hasMany(PaymentSQL, { foreignKey: "companyId" });
    PaymentSQL.belongsTo(CompanySQL, { foreignKey: "companyId" });
  }
}

export default PaymentSQL;