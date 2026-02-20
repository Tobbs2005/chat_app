import { AttachmentIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, HStack, Link, Text, VStack } from "@chakra-ui/layout";
import { Image } from "@chakra-ui/react";
import { TabPanel, TabPanels } from "@chakra-ui/tabs";
import { useContext } from "react";
import { FriendContext, MessageContext } from "./Home";
import Chatbox from "./Chatbox";
import { useEffect, useRef } from "react";

const formatBytes = (sizeInBytes = 0) => {
  if (!sizeInBytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(sizeInBytes) / Math.log(1024)), units.length - 1);
  const value = sizeInBytes / 1024 ** unitIndex;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const getFileHref = (file) => {
  if (!file) {
    return "";
  }

  const hasKey = typeof file.key === "string" && file.key.length > 0;
  const url = typeof file.url === "string" ? file.url : "";

  if (hasKey) {
    const looksLikeBareS3Url =
      url.includes("amazonaws.com/") &&
      !url.includes("X-Amz-Signature") &&
      !url.includes("X-Amz-Credential");

    if (!url || looksLikeBareS3Url) {
      return `http://localhost:4000/files/open?key=${encodeURIComponent(file.key)}`;
    }
  }

  return url;
};

const renderMessageContent = (message) => {
  const isFileMessage = message.type === "file" && message.file;
  if (!isFileMessage) {
    return <Text>{message.content}</Text>;
  }

  const { file } = message;
  const fileHref = getFileHref(file);
  const isImage = file.mime && file.mime.startsWith("image/");
  if (isImage) {
    return (
      <VStack alignItems="flex-start" spacing={2}>
        <Link href={fileHref} isExternal>
          <Image
            src={fileHref}
            alt={file.name || "uploaded image"}
            maxH="220px"
            borderRadius="md"
            objectFit="cover"
          />
        </Link>
        <HStack fontSize="sm" spacing={2}>
          <AttachmentIcon />
          <Link href={fileHref} isExternal color="blue.600" textDecoration="underline">
            {file.name || "Image"}
          </Link>
          <Text color="gray.500">{formatBytes(file.size)}</Text>
        </HStack>
      </VStack>
    );
  }

  return (
    <HStack spacing={3}>
      <AttachmentIcon />
      <VStack alignItems="flex-start" spacing={0}>
        <Link href={fileHref} isExternal color="blue.600" textDecoration="underline">
          {file.name || "Attachment"}
          <ExternalLinkIcon mx="2px" />
        </Link>
        <Text fontSize="sm" color="gray.500">{formatBytes(file.size)}</Text>
      </VStack>
    </HStack>
  );
};

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
                <Box
                  key={msg.id || `msg:${friend.username}.${index}`}
                  fontSize="lg"
                  bg={msg.to === friend.userid ? 'blue.100' : 'gray.100'}
                  color="gray.800"
                  borderRadius="10px"
                  padding="0.5rem 1rem"
                  margin={msg.to === friend.userid ? '1rem 0 0 auto !important' : '1rem auto 0 0 !important'}
                  maxW="50%"
                >
                  {renderMessageContent(msg)}
                </Box>
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
