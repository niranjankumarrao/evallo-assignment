import axios from 'axios';
const BASE = process.env.REACT_APP_API_BASE || "https://YOUR-RENDER-APP.onrender.com";
const instance = axios.create({ baseURL: BASE, timeout: 5000 });
instance.interceptors.request.use(config=>{
  const token = localStorage.getItem('token');
  if(token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default {
  get: (u)=> instance.get(u),
  post: (u,d)=> instance.post(u,d),
  put: (u,d)=> instance.put(u,d),
  delete: (u)=> instance.delete(u)
};
