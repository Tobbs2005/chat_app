import { HStack, Button, Input } from '@chakra-ui/react'
import { Field, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import * as Yup from 'yup'

import socket from '../socket'
import { MessageContext } from './Home'

const Chatbox = ({ userid }) => {
  const { messages, setMessages } = useContext(MessageContext);
  return (
    <Formik
      initialValues={{ message: '' }}
      validationSchema={Yup.object({
        message: Yup.string().min(1, 'Message is required').max(1000, 'Message is too long!')
      })}
      onSubmit={(values, actions) => {
        const messsage = {
          to: userid,
          from: null,
          content: values.message,
          timestamp: new Date().toISOString(),
        }
        socket.emit("dm", messsage);
        setMessages(prevMessages => [messsage, ...prevMessages]);
        actions.resetForm();
      }}
    >
      <HStack as={Form} w="100%" pb="1.4rem" px="1.4rem">
        <Input as={Field} name="message" placeholder="Type your message here" size="lg" autoComplete="off"/>
        <Button type="submit" colorScheme="teal" size="lg">Send</Button>
      </HStack>
    </Formik>
  )
}

export default Chatbox

