import { ChatIcon } from "@chakra-ui/icons"
import { Button, Circle, Divider, Heading, HStack, Tab, TabList, Text, VStack } from "@chakra-ui/react"
import { useContext } from "react";
import { FriendContext } from "./Home";

const Sidebar = () => {
  const {friends, setFriends} = useContext(FriendContext);
  return (
    <VStack py="1.4rem">
      <HStack justify="space-evenly" w="100%">
        <Heading size="md">Add Friend</Heading>
        <Button>
          <ChatIcon />
        </Button>
      </HStack>
      <Divider />
      <VStack as={TabList}>
        {friends.map((friend) => (
          <HStack as={Tab}>
            <Circle bg={friend.connected ? "green.700" : "red.500"} w="20px" h="20px" />
            <Text>{friend.username}</Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default Sidebar;