import {
  HStack,
  Button,
  Input,
  IconButton,
  Progress,
  Text,
  VStack,
  Box,
} from '@chakra-ui/react'
import { AttachmentIcon, CloseIcon } from "@chakra-ui/icons";
import { Field, Form, Formik } from 'formik'
import React, { useContext, useRef, useState } from 'react'
import * as Yup from 'yup'

import socket from '../socket'
import { MessageContext } from './Home'

const createClientId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatBytes = (sizeInBytes = 0) => {
  if (!sizeInBytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(sizeInBytes) / Math.log(1024)), units.length - 1);
  const value = sizeInBytes / 1024 ** unitIndex;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const uploadWithProgress = (uploadUrl, file, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

const Chatbox = ({ userid }) => {
  const { setMessages } = useContext(MessageContext);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const updateAttachment = (id, nextState) => {
    setAttachments(prevAttachments =>
      prevAttachments.map(attachment => (attachment.id === id ? { ...attachment, ...nextState } : attachment))
    );
  };

  const requestPresignedUpload = async (file) => {
    const response = await fetch("http://localhost:4000/files/presign", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: file.name,
        mime: file.type,
        size: file.size,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Failed to create upload URL");
    }
    return payload;
  };

  const handleFilesSelected = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }

    const pendingAttachments = selectedFiles.map(file => ({
      id: createClientId(),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending",
      error: "",
    }));
    setAttachments(prev => [...pendingAttachments, ...prev]);
    fileInputRef.current.value = "";
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(file => file.id !== id));
  };

  return (
    <Formik
      initialValues={{ message: '' }}
      validationSchema={Yup.object({
        message: Yup.string().max(1000, 'Message is too long!')
      })}
      onSubmit={async (values, actions) => {
        if (!userid) {
          return;
        }

        const messageContent = values.message.trim();
        const filesToUpload = attachments.filter(file => file.status === "pending" || file.status === "error");
        if (!messageContent && filesToUpload.length === 0) {
          return;
        }

        if (messageContent) {
          const messsage = {
            id: createClientId(),
            to: userid,
            from: null,
            type: "text",
            content: messageContent,
            timestamp: new Date().toISOString(),
          };
          socket.emit("dm", messsage);
          setMessages(prevMessages => [messsage, ...prevMessages]);
        }

        for (const attachment of filesToUpload) {
          try {
            updateAttachment(attachment.id, {
              status: "uploading",
              progress: 0,
              error: "",
            });
            const presigned = await requestPresignedUpload(attachment.file);
            await uploadWithProgress(presigned.uploadUrl, attachment.file, (progress) => {
              updateAttachment(attachment.id, { progress });
            });

            const fileMessage = {
              id: createClientId(),
              to: userid,
              from: null,
              type: "file",
              file: {
                url: presigned.openUrl,
                key: presigned.key,
                name: presigned.name,
                size: presigned.size,
                mime: presigned.mime,
              },
              timestamp: new Date().toISOString(),
            };
            socket.emit("dm", fileMessage);
            setMessages(prevMessages => [fileMessage, ...prevMessages]);
            updateAttachment(attachment.id, { status: "sent", progress: 100 });
          } catch (error) {
            updateAttachment(attachment.id, {
              status: "error",
              error: error.message || "Upload failed",
            });
          }
        }

        setAttachments(prev => prev.filter(file => file.status === "error"));
        actions.resetForm();
      }}
    >
      <VStack as={Form} w="100%" pb="1.4rem" px="1.4rem" spacing={3}>
        {attachments.map(upload => (
          <VStack key={upload.id} w="100%" spacing={1} alignItems="stretch">
            <HStack justifyContent="space-between" fontSize="sm">
              <Text isTruncated maxW="75%">{upload.name}</Text>
              <HStack spacing={2}>
                <Text color="gray.500">{formatBytes(upload.size)}</Text>
                <IconButton
                  aria-label="Remove attachment"
                  size="xs"
                  variant="ghost"
                  icon={<CloseIcon boxSize={2} />}
                  onClick={() => removeAttachment(upload.id)}
                  isDisabled={upload.status === "uploading"}
                />
              </HStack>
            </HStack>
            <Box>
              <Progress
                value={upload.progress}
                size="sm"
                colorScheme={upload.status === "error" ? "red" : "teal"}
                borderRadius="md"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {upload.status === "pending" ? "Ready to send" : null}
                {upload.status === "uploading" ? `Uploading ${upload.progress}%` : null}
                {upload.status === "sent" ? "Sent" : null}
              </Text>
            </Box>
            {upload.status === "error" ? (
              <Text fontSize="xs" color="red.500">{upload.error}</Text>
            ) : null}
          </VStack>
        ))}
        <HStack w="100%">
          <input
            hidden
            multiple
            ref={fileInputRef}
            type="file"
            onChange={handleFilesSelected}
          />
          <IconButton
            aria-label="Attach file"
            icon={<AttachmentIcon />}
            onClick={() => fileInputRef.current?.click()}
          />
          <Input as={Field} name="message" placeholder="Type your message here" size="lg" autoComplete="off"/>
          <Button type="submit" colorScheme="teal" size="lg">Send</Button>
        </HStack>
      </VStack>
    </Formik>
  )
}

export default Chatbox

