import { useEffect } from "react";
import socket from "../socket";
import { AccountContext } from "../AccountContext";
import { useContext } from "react";

const useSocketSetup = (setFriendList, setMessages) => {
  const { setUser } = useContext(AccountContext);
  useEffect(() => {
    socket.connect();
    socket.on("friends", (friendList)=>{
      setFriendList(friendList);
    })
    socket.on("messages", (messages)=>{
      setMessages(messages);
    })
    socket.on("connected", (status, username)=>{
      setFriendList(prevFriends => {
        return [...prevFriends].map(friend => {
          if (friend.username === username) {
            friend.connected = status;
          }
          return friend;
        });
      });
    })
    socket.on("connect_error", (error)=>{
      console.error(error);
      setUser({ loggedIn: false });
    })
    return () => {
      socket.off("connect_error");
      socket.off("friends");
      socket.off("messages");
      socket.off("connected");
    }
  }, [setUser, setFriendList, setMessages]);
}

export default useSocketSetup;