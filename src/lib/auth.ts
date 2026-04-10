import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth configuration.
 * Uses a credentials provider (email + password) for self-hosted setups.
 * The first user to register automatically becomes an admin.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        isSignUp: { label: "Sign Up", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Sign-up flow
        if (credentials.isSignUp === "true") {
          const existingUser = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (existingUser) {
            throw new Error("A user with this email already exists");
          }

          // Check if this is the first user (they become admin)
          const userCount = await prisma.user.count();
          const role = userCount === 0 ? "ADMIN" : "USER";

          const hashedPassword = await bcrypt.hash(credentials.password, 12);

          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name || credentials.email.split("@")[0],
              hashedPassword,
              role,
              workspaces: {
                create: {
                  name: "My Workspace",
                  icon: "📋",
                },
              },
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // Sign-in flow
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
