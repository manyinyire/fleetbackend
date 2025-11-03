"use client";

import { Button, Icon, useColorModeValue } from "@chakra-ui/react";
import { GoogleIcon } from "@/assets/icons";

export default function GoogleSigninButton({ text }: { text: string }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

  return (
    <Button
      variant="outline"
      w="full"
      h={14}
      borderColor={borderColor}
      _hover={{ bg: hoverBg }}
      leftIcon={<Icon as={GoogleIcon} boxSize={5} />}
    >
      {text} with Google
    </Button>
  );
}
