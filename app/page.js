import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles auth redirect:
  // - Not logged in → /login
  // - Logged in → /dashboard
  redirect("/dashboard");
}
