import Link from "next/link";
import SignupWithPassword from "../SignupWithPassword";

export default function Signup() {
  return (
    <>
      <div>
        <SignupWithPassword />
      </div>

      <div className="mt-6 text-center">
        <p>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary">
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}
