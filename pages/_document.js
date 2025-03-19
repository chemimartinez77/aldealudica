// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";
import theme from "../lib/theme";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        {/* Configura el color mode de Chakra en SSR */}
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
