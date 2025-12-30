import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// axiosInstance.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       localStorage.removeItem("token");
//       window.location.href = "/login";
//     } else if (error.response.status === 500) {
//       console.error("Server error, Please try again");
//     } else if (error.code === "ECONNABORTED") {
//       console.error("Request tomeout, Please try again");
//     }
//     return Promise.reject(error);
//   }
// );

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (status === 500) {
        console.error("Server error, please try again.");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout, please try again.");
    } else {
      console.error("Network error or no response from server:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
