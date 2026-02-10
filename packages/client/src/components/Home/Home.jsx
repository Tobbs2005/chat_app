import { Grid, GridItem, Tabs } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
import { createContext, useState } from "react";

export const FriendContext = createContext();

const Home = () => {
  const [friends, setFriends] = useState([]);
  return (
    <FriendContext.Provider value={{friends, setFriends}}>
      <Grid templateColumns="repeat(10, 1fr)" h="100vh" as={Tabs}> 
        <GridItem colSpan={3} borderRight="1px solid grey">
          <Sidebar />
        </GridItem>
        <GridItem colSpan={7}>
          <Chat/>
        </GridItem>
      </Grid>
    </FriendContext.Provider>
  );
};

export default Home;