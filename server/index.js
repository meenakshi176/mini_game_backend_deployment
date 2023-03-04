const { userrouter } = require("./routes/user.router");
const express = require("express");
const cors = require("cors");
const { connection } = require("./config/db");
const socket = require("socket.io");
const roomHandler = require("./roomHandler");
require("dotenv").config();
const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Home Page");
});
app.use("/users", userrouter);

const rooms = [];
global.OnlineUsers = new Map();

const server = app.listen(process.env.port, async () => {
  try {
    await connection;
    console.log(" SuccessFull Connected with database");
  } catch (err) {
    console.log("Problem connecting with database");
    console.log(err);
  }
  console.log(`server is running at ${process.env.port}`);
});

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  roomHandler(io, socket, rooms);
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    OnlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = OnlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieved", data.message);
    }
  });
});
