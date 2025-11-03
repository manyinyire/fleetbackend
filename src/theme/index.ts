import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: "#e8efff",
    100: "#c5d3ff",
    200: "#a1b8ff",
    300: "#7d9cff",
    400: "#5a81fa",
    500: "#1e3a8a",
    600: "#162c6a",
    700: "#10204c",
    800: "#0a1530",
    900: "#050b17",
  },
  accent: {
    50: "#e8f8ff",
    100: "#c5ecff",
    200: "#a1e1ff",
    300: "#7dd5ff",
    400: "#38bdf8",
    500: "#159cd6",
    600: "#0f7ab4",
    700: "#095992",
    800: "#043a70",
    900: "#01204f",
  },
};

const fonts = {
  heading: "'Inter', 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: "'Inter', 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const components = {
  Button: {
    defaultProps: {
      colorScheme: "brand",
      borderRadius: "md",
    },
  },
  Link: {
    baseStyle: {
      color: "brand.500",
      _hover: {
        textDecoration: "none",
        color: "brand.600",
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: "xl",
        shadow: "md",
      },
    },
  },
};

const styles = {
  global: {
    body: {
      bg: { base: "gray.50", _dark: "gray.900" },
      color: { base: "gray.800", _dark: "gray.100" },
    },
  },
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
});

export type AppTheme = typeof theme;

export default theme;
