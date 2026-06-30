// Client-side auth utilities — signIn, signOut, auth
// Uses shared config from auth-config.ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth-config";

export const { signIn, signOut, auth } = NextAuth(authConfig);
