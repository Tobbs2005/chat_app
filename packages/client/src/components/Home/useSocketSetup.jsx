import { useEffect } from "react";
import socket from "../socket";
import { AccountContext } from "../AccountContext";
import { useContext } from "react";

const useSocketSetup = () => {
  const { setUser } = useContext(AccountContext);
  useEffect(() => {
    socket.connect();
    socket.on("connect_error", (error)=>{
      console.error(error);
      setUser({ loggedIn: false });
    })
    return () => {
      socket.off("connect_error");
    }
  }, []);
}

export default useSocketSetup;