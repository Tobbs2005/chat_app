import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@chakra-ui/modal";
import { Button, ModalOverlay, Heading } from "@chakra-ui/react";
import { friendSchema } from "@whatsapp-clone/common";
import socket from "../socket";
import { Form, Formik } from "formik";
import TextField from "../TextField";
import { useCallback, useContext, useState } from "react";
import { FriendContext } from "./Home";

const AddFriendModal = ({ isOpen, onClose }) => {
  const [error, setError] = useState("");
  const {friendList, setFriendList} = useContext(FriendContext);
  const closeModal = useCallback(
    () => {
      setError("");
      onClose();
    },
    [onClose]
  )
  return (
    <Modal isOpen={isOpen} onClose={closeModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add a friend!</ModalHeader>
        <ModalCloseButton />
        <Formik
          initialValues={{ friendName: "" }}
          onSubmit={values => {
            socket.emit("add_friend", values.friendName, ({errorMsg, done, newFriend})=>{
              if (done) {
                setFriendList(c => [newFriend, ...c])
                closeModal();
                return;
              } else {
                setError(errorMsg);
              }
            });
          }}
          validationSchema={friendSchema}
        >
          <Form>
            <ModalBody>
              <Heading fontSize="xl" as="p" color="red.500" textAlign="center">
                {error}
              </Heading>
              <TextField
                label="Friend's name"
                placeholder="Enter friend's username.."
                autoComplete="off"
                name="friendName"
              />
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" type="submit">
                Submit
              </Button>
            </ModalFooter>
          </Form>
        </Formik>
      </ModalContent>
    </Modal>
  );
};

export default AddFriendModal;
