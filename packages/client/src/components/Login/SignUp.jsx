import { VStack, ButtonGroup, FormControl, FormLabel, Button, FormErrorMessage, Input, Heading, Text } from '@chakra-ui/react'
import { Form, Formik, useFormik } from 'formik';
import { formSchema } from '@whatsapp-clone/common';
import TextField from './TextField';
import { useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { AccountContext } from '../AccountContent';
import { useContext, useState } from 'react';

const SignUp = () => {
  const navigate = useNavigate();
  const {user, setUser} = useContext(AccountContext);
  const [errors, setErrors] = useState(null);
  return (
    <Formik 
      initialValues = {{username: "", password: ""}}
      validationSchema = {formSchema}
      onSubmit= {(values, actions) => {
        const vals = {...values}
        alert(JSON.stringify(values, null, 2));
        actions.resetForm();
        fetch("http://localhost:4000/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vals),
        }).catch(err => {
          return;
        }).then(res => {
          if (!res || !res.ok || res.status >= 400) {
            return;
          }
          return res.json();
        }).then(data => {
          if (!data || data.error) {
            return;
          }
          if (data.status) {
            setErrors(data.status);
          } else if (data.loggedIn) {
            setUser({...data});
            navigate("/home");
          }
        })
      }}
    >
      {(formik) => (
        <VStack as={Form} w={{base: "90%", md: "500px"}} m="auto" 
        justify="center" h="100vh" spacing="1rem">

          <Heading>
            Sign Up
          </Heading>
          <Text as='p' color='red.500'>{errors}</Text>
          <TextField name="username" placeholder="Enter Username" autoComplete="off" label="Username"/>
          
          <TextField name="password" placeholder="Enter Password" autoComplete="off" label="Password" type="password"/>
          

          <ButtonGroup paddingTop='1rem'>
            <Button colorScheme='teal' onClick={()=>navigate("/")} leftIcon={<ArrowBackIcon/>}>Back</Button>
            <Button type="submit">Sign Up</Button>
          </ButtonGroup>
        </VStack>
      )}
    </Formik>
  )
}

export default SignUp