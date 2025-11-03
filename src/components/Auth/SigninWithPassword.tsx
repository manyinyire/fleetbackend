"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import NextLink from "next/link";
import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Link,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SigninWithPassword() {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        toast({
          status: "error",
          title: "Login failed",
          description: result.error.message ?? "Please check your credentials and try again.",
        });
        return;
      }

      toast({
        status: "success",
        title: "Welcome back",
        description: "You are now signed in.",
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      if ((result.data?.user as any)?.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast({
        status: "error",
        title: "Unexpected error",
        description: "Something went wrong while signing you in.",
      });
    }
  };

  return (
    <Stack as="form" spacing={6} onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!!errors.email}>
        <FormLabel>Email</FormLabel>
        <Input type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
        <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.password}>
        <FormLabel>Password</FormLabel>
        <Input type="password" placeholder="Enter your password" autoComplete="current-password" {...register("password")} />
        <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
      </FormControl>

      <HStack justify="space-between" fontSize="sm">
        <Checkbox {...register("remember")}>Remember me</Checkbox>
        <Link as={NextLink} href="/auth/forgot-password" color="brand.600" fontWeight="medium">
          Forgot password?
        </Link>
      </HStack>

      <Button type="submit" colorScheme="brand" size="lg" isLoading={isSubmitting} loadingText="Signing in">
        Sign In
      </Button>
    </Stack>
  );
}
