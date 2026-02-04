const express = require('express');
const {Server} = require('socket.io');
const app = express();
const helmet = require('helmet');
const cors = require('cors');


const authRouter = require('./routers/authRouter');


const session = require('express-session');
require('dotenv').config();

const server = require('http').createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
});

app.use(helmet()); 

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));




app.use(express.json());

app.use(session({
  secret: process.env.COOKIE_SECRET,
  credentials: true,
  name: 'sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.ENVIRONMENT === 'production' ? 'true' : 'auto',
    httpOnly: true,
    sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  },
}));

app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.send('Hello World');
});

io.on('connection', (socket) => {
  console.log('A user connected');
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});