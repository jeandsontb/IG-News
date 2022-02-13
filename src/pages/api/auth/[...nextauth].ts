import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { query } from 'faunadb';

import { fauna } from '../../../services/fauna';


export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID, 
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: 'read:user',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      const { email: emailQuery } = user;

      try {
        await fauna.query(
          query.Create(
            query.Collection('users'),
            { data: {emailQuery} }
          )
        )
        return true;
      } catch {
        return false;
      }
    },
  }
})