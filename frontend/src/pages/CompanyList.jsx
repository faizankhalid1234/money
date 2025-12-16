import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function CompanyList() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/company", {
        headers: {
          token: "MY_SECRET_TOKEN",
          merchant_id: null
        }
      });
      setCompanies(res.data);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch companies", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This company will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (confirm.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/company/${id}`, {
          headers: {
            token: "MY_SECRET_TOKEN",
            merchant_id: null
          }
        });
        setCompanies((prev) => prev.filter((c) => c._id !== id));
        Swal.fire("Deleted!", "Company has been deleted.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete company.", "error");
      }
    }
  };

  if (loading) return <h3 style={{ textAlign: "center", marginTop: 50 }}>Loading...</h3>;

  return (
    <div style={{ maxWidth: 800, margin: "50px auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2>Companies</h2>
        <button style={styles.addBtn} onClick={() => navigate("/company/new")}>
          + Add New Company
        </button>
      </div>

      {companies.length === 0 ? (
        <p style={{ textAlign: "center", color: "#777" }}>No companies found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f6ff" }}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Merchant ID</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c._id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>{c.email}</td>
                <td style={styles.td}>{c.merchant_id}</td>
                <td style={styles.td}>
                  <button style={styles.editBtn} onClick={() => navigate(`/company/edit/${c._id}`)}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(c._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  addBtn: { padding: "10px 18px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" },
  th: { padding: 10, textAlign: "left" },
  td: { padding: 10 },
  editBtn: { marginRight: 10, padding: "4px 8px", background: "#FFC107", border: "none", borderRadius: 8, cursor: "pointer" },
  deleteBtn: { padding: "4px 8px", background: "#d33", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" },
};
