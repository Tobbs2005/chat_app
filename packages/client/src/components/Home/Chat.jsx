import { Text, VStack } from "@chakra-ui/layout";
import { TabPanel, TabPanels } from "@chakra-ui/tabs";
import { useContext } from "react";
import { FriendContext, MessageContext } from "./Home";
import Chatbox from "./Chatbox";
import { useEffect, useRef } from "react";

const Chat = ({ userid }) => {
  const { friendList } = useContext(FriendContext);
  const { messages } = useContext(MessageContext);
  const bottomDiv = useRef(null);

  useEffect(() => {
    bottomDiv.current?.scrollIntoView({ behavior: "smooth" });
  });

  return friendList.length > 0 ? (
    <VStack h="100%" justify="end">
      <TabPanels overflowY="scroll">
        {friendList.map(friend => (
          <VStack flexDirection="column-reverse" as={TabPanel} key={`chat:${friend.username}`}>
            <div ref={bottomDiv}/>
            {messages
              .filter(msg => msg.to === friend.userid || msg.from === friend.userid)
              .map((msg, index) => (
                <Text key={`msg:${friend.username}.${index}`} 
                fontSize="lg"
                bg={msg.to === friend.userid ? 'blue.100' : 'gray.100'}
                color="gray.800"
                borderRadius="10px"
                padding="0.5rem 1rem"
                margin={msg.to === friend.userid ? '1rem 0 0 auto !important' : '1rem auto 0 0 !important'}
                maxW="50%"
                >
                  {msg.content}
                </Text>
              ))}
          </VStack>
        ))}
      </TabPanels>
      <Chatbox userid={userid} />
    </VStack>
  ) : (
    <VStack
      justify="center"
      pt="5rem"
      w="100%"
      textAlign="center"
      fontSize="lg"
    >
      <TabPanels> 
        <TabPanel>
          <Text>No friend :( Click add friend to start chatting</Text>
        </TabPanel>
       
      </TabPanels>
    </VStack>
  );
};

export default Chat;
