import axios from "axios";

export const createChargeOnSwipe = async (form) => {
  const response = await axios.post(
    "http://localhost:5000/api/charge",
    form,
    { headers: { "Content-Type": "application/json" } }
  );

  return response.data;
};
