import api from "./api";

export const registerUser = async (userData) => {
  try {
    const response = await api.post("http://localhost:5000/api/auth/register", userData);
    return response.data;
  } catch (error) {
    console.log("Registration error:", error);
    throw error;
  }
};
