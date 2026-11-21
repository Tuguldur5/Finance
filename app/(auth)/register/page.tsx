import { redirect } from "next/navigation";

/** Email/password registration is gone — Google is the only provider. */
export default function RegisterPage() {
  redirect("/login");
}
