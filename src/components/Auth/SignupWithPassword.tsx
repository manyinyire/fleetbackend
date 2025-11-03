"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  Input,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { signUp } from "@/server/actions/auth";

const signUpSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    companyName: z.string().min(1, "Company name is required"),
    phone: z.string().min(6, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignupWithPassword() {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("companyName", values.companyName);
      formData.append("phone", values.phone);

      await signUp(formData);
      toast({
        status: "success",
        title: "Account created",
        description: "Redirecting you to onboarding...",
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        return;
      }

      console.error("Signup error:", error);
      toast({
        status: "error",
        title: "Unable to create account",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <Stack as="form" spacing={6} onSubmit={handleSubmit(onSubmit)}>
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
        <GridItem>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel>Full Name</FormLabel>
            <Input placeholder="Jane Doe" autoComplete="name" {...register("name")} />
            <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
          </FormControl>
        </GridItem>
        <GridItem>
          <FormControl isInvalid={!!errors.companyName}>
            <FormLabel>Company Name</FormLabel>
            <Input placeholder="Azaire Transport" {...register("companyName")} />
            <FormErrorMessage>{errors.companyName?.message}</FormErrorMessage>
          </FormControl>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
        <GridItem>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>
        </GridItem>
        <GridItem>
          <FormControl isInvalid={!!errors.phone}>
            <FormLabel>Phone Number</FormLabel>
            <Input type="tel" placeholder="+263 77 123 4567" autoComplete="tel" {...register("phone")} />
            <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
          </FormControl>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
        <GridItem>
          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input type="password" placeholder="Create a secure password" autoComplete="new-password" {...register("password")} />
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>
        </GridItem>
        <GridItem>
          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm Password</FormLabel>
            <Input type="password" placeholder="Re-enter your password" autoComplete="new-password" {...register("confirmPassword")} />
            <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
          </FormControl>
        </GridItem>
      </Grid>

      <Button type="submit" colorScheme="brand" size="lg" isLoading={isSubmitting} loadingText="Creating account">
        Create Account
      </Button>
    </Stack>
  );
}
