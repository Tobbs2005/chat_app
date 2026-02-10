import { TabPanel, TabPanels, Text, VStack } from '@chakra-ui/react'
import React, { useContext } from 'react'
import { FriendContext } from './Home';

const Chat = () => {
  const {friends} = useContext(FriendContext);
  return friends.length > 0 ? (
    <VStack>
      <TabPanels>
        <TabPanel>Friend 1</TabPanel>
        <TabPanel>Friend 2</TabPanel>
      </TabPanels>
    </VStack>
  ) : (
    <VStack justify="center" pt="5rem" w="100%" textAlign="center" fontSize="lg">
      <TabPanels>
        <Text>No friends found</Text>
      </TabPanels>
    </VStack>
    
  );
}

export default Chat