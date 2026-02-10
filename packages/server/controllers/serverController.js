const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const redisClient = require("../redis");
require("dotenv").config();

const sessionMiddleware = session({
  secret: process.env.COOKIE_SECRET,
  credentials: true,
  name: "sid",
  store: new RedisStore({ client: redisClient }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.ENVIRONMENT === "production" ? "true" : "auto",
    httpOnly: true,
    expires: 1000 * 60 * 60 * 24 * 7,
    sameSite: process.env.ENVIRONMENT === "production" ? "none" : "lax",
  },
})

const wrap = (expressMiddleware) => (socket, next) => {
  expressMiddleware(socket.request, {}, next);
}

const corsConfig = {
  origin: "http://localhost:3000",
  credentials: "true",
};

module.exports = { sessionMiddleware, wrap, corsConfig };