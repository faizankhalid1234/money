import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";

export default function CompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  // LOAD COMPANY FOR EDIT
  useEffect(() => {
    if (id) {
      axios
        .get(`http://localhost:5000/api/company/${id}`, {
          headers: { token: "MY_SECRET_TOKEN" }
        })
        .then((res) => {
          setForm({
            name: res.data.name,
            email: res.data.email,
          });
        })
        .catch(() =>
          Swal.fire("Error", "Failed to fetch company data", "error")
        );
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name)
      return Swal.fire("Validation", "Company Name is required", "warning");
    if (!form.email)
      return Swal.fire("Validation", "Email is required", "warning");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (id) {
        await axios.put(`http://localhost:5000/api/company/${id}`, form, {
          headers: { token: "MY_SECRET_TOKEN" }
        });
        Swal.fire("Success", "Company updated successfully", "success");
      } else {
        await axios.post("http://localhost:5000/api/company", form, {
          headers: { token: "MY_SECRET_TOKEN" }
        });
        Swal.fire("Success", "Company created successfully", "success");
      }
      navigate("/companies");
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Server error",
        "error"
      );
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{id ? "Edit Company" : "New Company"}</h2>
      <form onSubmit={handleSubmit}>
        {["name", "email"].map((field) => (
          <div key={field} style={styles.inputGroup}>
            <label>{field.toUpperCase()}</label>
            <input
              type={field === "email" ? "email" : "text"}
              name={field}
              value={form[field]}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        ))}
        <button type="submit" style={styles.submitBtn} disabled={loading}>
          {loading ? "Saving..." : "Save Company"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: "50px auto", padding: 30, background: "#f0f4ff", borderRadius: 20 },
  title: { textAlign: "center", marginBottom: 25, fontSize: 26, color: "#4A90E2" },
  inputGroup: { marginBottom: 15, display: "flex", flexDirection: "column" },
  input: { padding: 10, fontSize: 16, borderRadius: 10, border: "1px solid #ccc", marginTop: 5 },
  submitBtn: { padding: 14, width: "100%", background: "#4A90E2", color: "#fff", border: "none", borderRadius: 12, fontSize: 16 },
};
