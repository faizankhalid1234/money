import axios from "axios";

export const sendEmail = async (toEmail, subject, html) => {
  try {
    const response = await axios.post(
      "https://sandbox.api.mailtrap.io/api/send/4267784",
      {
        from: {
          email: "hello@example.com",
          name: "SwipePoint",
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject,
        html,
        category: "SwipePoint Email",
      },
      {
        headers: {
          Authorization: "Bearer a9d1b7e7c3bb56af18be2b569ff8c642",
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Mailtrap Error:", error.response?.data || error.message);
    throw error;
  }
};
