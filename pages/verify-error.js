// pages/verify-error.js
import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";
import Link from "next/link";

export default function VerifyError() {
  return (
    <Box
      minH="100vh"
      bg="red.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={6} p={8} bg="white" rounded="md" shadow="lg">
        <Heading color="red.600">Algo ha fallado</Heading>
        <Text fontSize="lg" textAlign="center" color="gray.700">
          Ha ocurrido un error al intentar verificar tu cuenta. Intenta más
          tarde o contacta con soporte.
        </Text>
        <Link href="/" passHref>
          <Button colorScheme="red">Volver al inicio</Button>
        </Link>
      </VStack>
    </Box>
  );
}
