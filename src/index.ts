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

dotenv.config()
const app = express()
const PORT = Number(process.env.PORT) || 3000

connectDB()

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

app.listen(PORT, () => {
    console.log("server running on port ",PORT)
    swaggerDocs(app, PORT)
})