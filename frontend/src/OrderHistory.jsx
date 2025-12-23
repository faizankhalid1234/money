import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "./services/api.js";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const maskCVV = (cvv)=>cvv?"*".repeat(cvv.length):"-";

  const fetchOrders = async () => {
    try {
      const res = await api.get("/payments");
      let data = res.data?.data || [];

      const identityRaw = localStorage.getItem("payment_user_identity");
      if(identityRaw){
        const identity = JSON.parse(identityRaw);
        const emailLower = identity.email?.toLowerCase();
        const phoneStr = identity.phone?.toString();
        data = data.filter(o => (!emailLower || (o.email||"").toLowerCase()===emailLower) && (!phoneStr || (o.phone||"").toString()===phoneStr));
      }

      // Add company name from populated companyId
      data = data.map(o => ({
        ...o,
        companyName: o.companyId?.name || "-"
      }));

      setOrders(data.reverse());
    } catch(err){
      console.error(err);
      Swal.fire("Error","Failed to fetch orders","error");
    } finally{ setLoading(false); }
  };

  useEffect(()=>{ fetchOrders() },[]);

  const handleDelete = async (id)=>{
    const confirm = await Swal.fire({
      title:"Are you sure?",
      text:"This order will be deleted permanently!",
      icon:"warning",
      showCancelButton:true,
      confirmButtonColor:"#d33",
      confirmButtonText:"Yes, delete it!"
    });

    if(confirm.isConfirmed){
      try{
        await api.delete(`/payments/${id}`);
        setOrders(prev=>prev.filter(o=>o._id!==id));
        Swal.fire("Deleted!","Order has been deleted.","success");
      }catch(err){
        Swal.fire("Error","Failed to delete order.","error");
      }
    }
  };

  if(loading) return <h3 style={{textAlign:"center", marginTop:50}}>Loading...</h3>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Payment History</h2>
        <button style={styles.addBtn} onClick={()=>navigate("/payment")}>+ Add New Payment</button>
      </div>

      {orders.length===0?<p style={{textAlign:"center", color:"#777"}}>No orders found.</p>:
        <div style={styles.cardsContainer}>
          {orders.map(o=>(
            <div key={o._id} style={styles.card}>
              <Row label="Reference" value={o.reference}/>
              <Row label="Status" value={o.status} status/>
              <Row label="Amount Paid" value={`Rs ${o.amount}`}/>
              <Row label="SwipePoint Fee" value={`Rs ${o.fee||0}`}/>
              <Row label="Company Receives" value={`Rs ${o.netAmount||o.amount}`}/>
              <Row label="Merchant ID" value={o.merchant_id||"-"}/>
              <Row label="Company Name" value={o.companyName||"-"}/>
              <Row label="Email" value={o.email||"-"}/>
              <Row label="Phone" value={o.phone||"-"}/>
              <Row label="CVV" value={maskCVV(o.cardCVV)}/>
              <button style={styles.deleteBtn} onClick={()=>handleDelete(o._id)}>Delete</button>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

const Row = ({label,value,status})=>(
  <div style={styles.cardRow}>
    <span style={styles.label}>{label}:</span>
    <span style={status?{...styles.statusBadge, background: value?.toLowerCase()==="success"?"#2ecc71":value?.toLowerCase()==="pending"?"#f1c40f":"#e74c3c"}:{}}>
      {value||"-"}
    </span>
  </div>
)

const styles = {
  container:{ maxWidth:900, margin:"50px auto", padding:20, fontFamily:"Arial" },
  header:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:25 },
  addBtn:{ padding:"10px 18px", background:"#4a90e2", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:"bold" },
  cardsContainer:{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:20 },
  card:{ background:"#f5f6ff", borderRadius:14, padding:20, boxShadow:"0 4px 15px rgba(0,0,0,0.1)", display:"flex", flexDirection:"column", gap:10 },
  cardRow:{ display:"flex", justifyContent:"space-between", fontSize:14 },
  label:{ fontWeight:600 },
  statusBadge:{ color:"#fff", padding:"3px 10px", borderRadius:12, fontSize:12, textTransform:"capitalize" },
  deleteBtn:{ marginTop:15, padding:8, background:"#d33", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontWeight:600, fontSize:13 },
}
