// pages/verify-success.js
import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";
import Link from "next/link";

export default function VerifySuccessPage() {
  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={6} p={8} bg="white" rounded="md" shadow="lg">
        <Heading color="green.500">¡Bienvenido a la Aldea Lúdica!</Heading>
        <Text fontSize="lg" textAlign="center">
          Tu cuenta ha sido verificada con éxito. Ya puedes iniciar sesión.
        </Text>
        <Link href="/login" passHref>
          <Button colorScheme="green">Iniciar sesión</Button>
        </Link>
      </VStack>
    </Box>
  );
}
