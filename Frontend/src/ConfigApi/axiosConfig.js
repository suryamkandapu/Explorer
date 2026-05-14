import axios from 'axios';
import { API_URL } from '../../ConfigApi/Api';

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
