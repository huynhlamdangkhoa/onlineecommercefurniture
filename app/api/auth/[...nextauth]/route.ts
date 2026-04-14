// eslint-disable-next-line @typescript-eslint/no-require-imports
const NextAuth = require("next-auth").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CredentialsProvider = require("next-auth/providers/credentials").default;

import bcrypt from "bcryptjs";
import prisma from "@/utils/db";

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }: any) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

 session: {
  strategy: "jwt" as const,
  maxAge: 15 * 60,
},

  jwt: {
    maxAge: 15 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export async function GET(req: Request, context: any) {
  return handler(req, context);
}

export async function POST(req: Request, context: any) {
  return handler(req, context);
}