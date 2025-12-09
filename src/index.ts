import express from "express"
import cors from "cors"
import connectDB from "./config/connect.ts"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import repoRoute from "./routes/repoRoute.ts"
import pushRoute from "./routes/pushRoute.ts"
import {swaggerDocs} from "./utils/swagger.ts";
import healthRoute from "./routes/healthCheckRoute.ts"
import authRoute from "./routes/authRoute.ts"
import layoutRoute from "./routes/layoutRoute.ts"
import profileRoute from "./routes/profileRoute.ts"
import http from "http"
import { Server } from "socket.io"

dotenv.config()
const app = express()
const server = http.createServer(app)
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins
  }
})
const repoPage = io.of("/repoPage")
const PORT = Number(process.env.PORT) || 3000
connectDB()

repoPage.on("connection", (socket) => {
  console.log("connected")

  socket.emit("ping", ("pong"))

  socket.on("disconnect", () => {
    console.log("disconnected")
  })
})

app.use(cookieParser());  // later add security here
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/health", healthRoute)
app.use("/api/v1/auth", authRoute)
app.use("/api/v1/layout", layoutRoute)
app.use("/api/v1/repo", repoRoute)
app.use("/api/v1/profile", profileRoute)
app.use("/api/v1/push", pushRoute)

server.listen(PORT, () => {
    console.log("server running on port ",PORT)
    swaggerDocs(app, PORT)
})