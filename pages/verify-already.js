// pages/verify-already.js
import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";
import Link from "next/link";

export default function VerifyAlready() {
  return (
    <Box
      minH="100vh"
      bg="yellow.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={6} p={8} bg="white" rounded="md" shadow="lg">
        <Heading color="yellow.600">Tu cuenta ya estaba verificada</Heading>
        <Text fontSize="lg" textAlign="center" color="gray.700">
          Ya habías confirmado tu correo. Puedes iniciar sesión sin problemas.
        </Text>
        <Link href="/login" passHref>
          <Button colorScheme="yellow">Ir al login</Button>
        </Link>
      </VStack>
    </Box>
  );
}
