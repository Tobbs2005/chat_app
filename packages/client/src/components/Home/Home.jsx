import { Grid, GridItem, Tabs } from "@chakra-ui/react";
import { createContext, useState } from "react";
import Chat from "./Chat";
import Sidebar from "./Sidebar";
import useSocketSetup from "./useSocketSetup";
export const FriendContext = createContext();
export const MessageContext = createContext();


const Home = () => {
  const [friendList, setFriendList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [friendIndex, setFriendIndex] = useState(0);
  useSocketSetup(setFriendList, setMessages);
  return (
    <FriendContext.Provider value={{ friendList, setFriendList }}>
      <Grid templateColumns="repeat(10, 1fr)" h="100vh" as={Tabs} onChange={(index) => {setFriendIndex(index)
        console.log(index)
        console.log(friendList[index])
      }}>
        <GridItem colSpan="3" borderRight="1px solid gray">
          <Sidebar />
        </GridItem>
        <GridItem colSpan="7" maxH="100vh">
          <MessageContext.Provider value={{ messages, setMessages }}>
            <Chat userid={friendList[friendIndex]?.userid} friendIndex={friendIndex} />
          </MessageContext.Provider>
        </GridItem>
      </Grid>
    </FriendContext.Provider>
  );
};

export default Home;
