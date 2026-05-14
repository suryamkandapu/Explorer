import { io } from "socket.io-client";
import { API_URL } from "./ConfigApi/Api";

export const socket = io(API_URL, {
  withCredentials: true,
  transports: ["websocket"],
});