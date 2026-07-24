import axios from 'axios';

let accessToken: string | null = null;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export function setApiAccessToken(nextAccessToken: string | null) {
  accessToken = nextAccessToken;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
