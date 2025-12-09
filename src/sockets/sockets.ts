import express from "express"
import http from "http"
import {Server} from "socket.io"

const app = express()
const server = http.createServer(app)
const port = process.env.WEB_SOCKET_PORT || 5000

const allowedOrigins = [
    "http://localhost:5173"
]

const io = new Server(server, {
    path: "/api/v1/health/ping",
    cors: {
        origin: allowedOrigins
    }
})

io.on("connection", (socket) => {
    console.log("connected")

    socket.on("disconnect", () => {
        console.log("disconnected")
    })
})


const startServer = () => {
    server.listen(port, () => {
        console.log("web socket server running on port ",port)
    })
}

export default startServer