// src/pages/CompanyDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/company/${id}`, {
        headers: { 
          token: "MY_SECRET_TOKEN",
          merchant_id: null
        }
      })
      .then((res) => setCompany(res.data))
      .catch((err) => console.log(err));
  }, [id]);

  if (!company) return <h2>Loading...</h2>;

  return (
    <div style={{ maxWidth: 600, margin: "50px auto" }}>
      <h2>Company Details</h2>

      <p><b>Name:</b> {company.name}</p>
      <p><b>Email:</b> {company.email}</p>
      <p><b>Address:</b> {company.address}</p>
      <p><b>API Key:</b> {company.api_key}</p>
      <p><b>Secret Key:</b> {company.secret_key}</p>
      <p><b>Created At:</b> {new Date(company.createdAt).toLocaleString()}</p>
    </div>
  );
}
