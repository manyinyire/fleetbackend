"use client";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { UserIcon } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "../FormElements/InputGroup";
import { signUp } from "@/server/actions/auth";
import { toast } from "react-hot-toast";

export default function SignupWithPassword() {
  const [data, setData] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    // Validate required fields
    if (!data.name || !data.email || !data.companyName || !data.phone || !data.password) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('companyName', data.companyName);
      formData.append('phone', data.phone);

      await signUp(formData);
      // Server action will redirect to /onboarding automatically
    } catch (error) {
      console.error('Signup error:', error);
      // Check if error is a redirect (which is expected)
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // This is expected - let the redirect happen
        return;
      }
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        type="text"
        label="Full Name"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your full name"
        name="name"
        handleChange={handleChange}
        value={data.name}
        icon={<UserIcon className="size-5" />}
      />

      <InputGroup
        type="email"
        label="Email"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your email"
        name="email"
        handleChange={handleChange}
        value={data.email}
        icon={<EmailIcon />}
      />

      <InputGroup
        type="text"
        label="Company Name"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your company name"
        name="companyName"
        handleChange={handleChange}
        value={data.companyName}
        icon={<UserIcon className="size-5" />}
      />

      <InputGroup
        type="tel"
        label="Phone Number"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="+263 77 123 4567"
        name="phone"
        handleChange={handleChange}
        value={data.phone}
        icon={<UserIcon className="size-5" />}
      />

      <InputGroup
        type="password"
        label="Password"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your password"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={<PasswordIcon />}
      />

      <InputGroup
        type="password"
        label="Confirm Password"
        className="mb-5 [&_input]:py-[15px]"
        placeholder="Confirm your password"
        name="confirmPassword"
        handleChange={handleChange}
        value={data.confirmPassword}
        icon={<PasswordIcon />}
      />

      <div className="mb-4.5">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
        >
          Create Account
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}
