require("dotenv").config();
const express = require("express");
const { Server } = require("socket.io");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const authRouter = require("./routers/authRouter");
const filesRouter = require("./routers/filesRouter");
const { sessionMiddleware, wrap, corsConfig } = require("./controllers/serverController");
const server = require("http").createServer(app);
const { authorizeUser, addFriend, onDisconnect, onDM } = require("./controllers/socketController");
const { initializeUser } = require("./controllers/socketController");
const io = new Server(server, {
  cors: corsConfig,
});
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors(corsConfig)
);
app.use(express.json());
app.use(
  sessionMiddleware
);
app.use("/auth", authRouter);
app.use("/files", filesRouter);

io.use(wrap(sessionMiddleware));

io.use(authorizeUser);

io.on("connect", socket => {
  initializeUser(socket);

  socket.on("add_friend", (friendName, cb) => {
    addFriend(socket, friendName, cb);
  });

  socket.on("disconnecting", () => {
    onDisconnect(socket);
  });

  socket.on("dm", (message) => {
    onDM(socket, message);
  });
});
server.listen(4000, () => {
  console.log("Server listening on port 4000");
});
