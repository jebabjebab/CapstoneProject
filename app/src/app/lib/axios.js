import axios from "axios";

const axiosRes = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api",
  timeout: 600000,
  withCredentials: true,
});

export default axiosRes;
