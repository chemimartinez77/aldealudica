// pages/verify-invalid.js
import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";
import Link from "next/link";

export default function VerifyInvalidPage() {
  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={6} p={8} bg="white" rounded="md" shadow="lg">
        <Heading color="red.500">Token inválido</Heading>
        <Text fontSize="lg" textAlign="center">
          El enlace de verificación no es válido o ya fue usado.
        </Text>
        <Link href="/" passHref>
          <Button colorScheme="red">Volver al inicio</Button>
        </Link>
      </VStack>
    </Box>
  );
}
