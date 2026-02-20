const redisClient = require("../redis");

const parseStoredMessage = (storedMessage) => {
  if (!storedMessage || typeof storedMessage !== "string") {
    return null;
  }

  const trimmedMessage = storedMessage.trim();
  if (trimmedMessage.startsWith("{")) {
    try {
      return JSON.parse(trimmedMessage);
    } catch (error) {
      console.error("Failed to parse JSON message:", error);
    }
  }

  const parsedStr = storedMessage.split(".");
  if (parsedStr.length < 3) {
    return null;
  }
  return {
    to: parsedStr[0],
    from: parsedStr[1],
    type: "text",
    content: parsedStr.slice(2).join("."),
  };
};

module.exports.authorizeUser = (socket, next) => {
  if (!socket.request.session || !socket.request.session.user) {
    console.log("Bad request!");
    next(new Error("Not authorized"));
  } else {
    next();
  }
};

module.exports.initializeUser = async socket => {
  socket.user = { ...socket.request.session.user };
  socket.join(socket.user.userid);
  await redisClient.hset(
    `userid:${socket.user.username}`,
    "userid",
    socket.user.userid,
    "connected",
    true
  );
  const friendList = await redisClient.lrange(
    `friends:${socket.user.username}`,
    0,
    -1
  );
  const parsedFriendList = await parseFriendList(friendList);
  const friendRooms = parsedFriendList.map(friend => friend.userid);
  //emit to all friends our online status
  if (friendRooms.length > 0) {
    socket.to(friendRooms).emit("connected", true, socket.user.username);
  }

  socket.emit("friends", parsedFriendList);


  // fetch messages
  const messageQuery = await redisClient.lrange(`chat:${socket.user.userid}`, 0, -1);
  const messages = messageQuery
    .map(parseStoredMessage)
    .filter(Boolean);
  if (messages.length > 0) {
    socket.emit("messages", messages);
  }
};

module.exports.addFriend = async (socket, friendName, cb) => {
  if (friendName === socket.user.username) {
    cb({ done: false, errorMsg: "Cannot add self!" });
    return;
  }
  const friend = await redisClient.hgetall(
    `userid:${friendName}`
  );
  const currentFriendList = await redisClient.lrange(
    `friends:${socket.user.username}`,
    0,
    -1
  );
  if (!friend.userid) {
    cb({ done: false, errorMsg: "User doesn't exist!" });
    return;
  }
  if (currentFriendList && currentFriendList.indexOf(friendName) !== -1) {
    cb({ done: false, errorMsg: "Friend already added!" });
    return;
  }

  await redisClient.lpush(`friends:${socket.user.username}`, [friendName, friend.userid].join("."));
  const newFriend = {
    username: friendName,
    userid: friend.userid,
    connected: friend.connected,
  }
  cb({ done: true,  newFriend });
};

module.exports.onDisconnect = async socket => {
  await redisClient.hset(`userid:${socket.user.username}`, "connected", "false");

  //get friends
  const friendList = await redisClient.lrange(`friends:${socket.user.username}`, 0, -1);
  const friendRooms = await parseFriendList(friendList).then(friends => 
    friends.map(friend => friend.userid)
  );
  //emit to all friends our offline status
  socket.to(friendRooms).emit("connected", false, socket.user.username);
};

const parseFriendList = async (friendList) => {
  const newFriendList = [];
  for (let friend of friendList) {
    const parsedFriend = friend.split(".");
    const friendConnected = await redisClient.hget(`userid:${parsedFriend[0]}`, "connected");
    newFriendList.push({
      username: parsedFriend[0],
      userid: parsedFriend[1],
      connected: friendConnected,
    });
  }
  return newFriendList;
};

module.exports.onDM = async (socket, message) => {
  const normalizedMessage = {
    ...message,
    from: socket.user.userid,
    type: message?.type || "text",
    timestamp: message?.timestamp || new Date().toISOString(),
  };

  const messageString = JSON.stringify(normalizedMessage);

  await redisClient.lpush(`chat:${normalizedMessage.to}`, messageString);
  await redisClient.lpush(`chat:${normalizedMessage.from}`, messageString);

  socket.to(normalizedMessage.to).emit("dm", normalizedMessage);
}