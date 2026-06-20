import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // read:user  — profile data and avatar
          // user:email — private email addresses
          // repo       — read/write Issues, Labels, and repo metadata
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    // Attach the database user id to every session object so we can use it
    // in Server Components and API routes without an extra DB lookup.
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
