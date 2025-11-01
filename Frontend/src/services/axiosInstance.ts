import axios from "axios";
import { apiService } from "./api";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

//Request interceptor - add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = apiService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//Response interceptor - handle 401 errors and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    //If the request is not retried and the status is 401, refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = apiService.getRefreshToken();

        if (!refreshToken) {
          //No refresh token, logout and redirect to login
          apiService.removeAccessToken();
          apiService.removeRefreshToken();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        //Refresh token
        const response = await axios.post(
          "http://localhost:5000/api/auth/refresh-token",
          { refreshToken }
        );

        const { accessToken } = response.data;
        apiService.setAccessToken(accessToken);

        //Retry the original request with new access token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        apiService.removeAccessToken();
        apiService.removeRefreshToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
