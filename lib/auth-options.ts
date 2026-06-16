import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import nodemailer from 'nodemailer';
import clientPromise from './mongodb-adapter';
import dbConnect from './db';
import User from '../models/User';
import Organization from '../models/Organization';

const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@localhost';

const smtpHost = process.env.EMAIL_SERVER_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.EMAIL_SERVER_PORT || process.env.EMAIL_PORT || 587);
const smtpSecure = (process.env.EMAIL_SERVER_SECURE || process.env.EMAIL_SECURE) === 'true';
const smtpUser = process.env.EMAIL_USER || process.env.EMAIL_SERVER_USER;
const smtpPass = process.env.EMAIL_PASS || process.env.EMAIL_SERVER_PASSWORD;
const emailTransportMode =
  process.env.EMAIL_TRANSPORT ||
  (process.env.EMAIL_USER && process.env.EMAIL_PASS ? 'smtp' : 'console');

const buildSmtpTransport = () => {
  if (!smtpUser || !smtpPass) {
    throw new Error('Missing SMTP credentials. Set EMAIL_USER and EMAIL_PASS, or use EMAIL_TRANSPORT=console for local testing.');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    EmailProvider({
      server: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      },
      from: emailFrom,
      async sendVerificationRequest({ identifier, url, provider }) {
        if (emailTransportMode !== 'smtp') {
          console.info('[NextAuth][email] Magic link for %s: %s', identifier, url);
          return;
        }

        const transport = buildSmtpTransport();
        const message = {
          to: identifier,
          from: provider.from,
          subject: `Sign in to ${provider.name}`,
          text: `Sign in to ${provider.name}: ${url}`,
          html: `<p>Sign in to <strong>${provider.name}</strong>:</p><p><a href="${url}">${url}</a></p>`,
        };

        await transport.sendMail(message);
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      await dbConnect();
      
      const dbUser = await User.findOne({ email: user.email.toLowerCase() });
      if (dbUser && dbUser.status === 'disabled') {
        return false; // Block user login if disabled
      }
      return true;
    },
    async jwt({ token, user }) {
      await dbConnect();
      
      const email = token.email || user?.email;
      if (email) {
        let dbUser = await User.findOne({ email: email.toLowerCase() });
        
        if (dbUser) {
          let updated = false;
          
          // Auto-promote admin@example.com or enterprise@example.com
          if (dbUser.email === 'admin@example.com' && dbUser.role !== 'admin') {
            dbUser.role = 'admin';
            updated = true;
          } else if (dbUser.email === 'enterprise@example.com' && dbUser.role !== 'enterprise_admin') {
            dbUser.role = 'enterprise_admin';
            updated = true;
          } else {
            // Promote first user ever to admin
            const totalUsers = await User.countDocuments();
            if (totalUsers === 1 && dbUser.role !== 'admin') {
              dbUser.role = 'admin';
              updated = true;
            }
          }
          
          // Domain auto-joining
          if (!dbUser.organizationId) {
            const domain = dbUser.email.split('@')[1];
            const ignoreDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
            if (domain && !ignoreDomains.includes(domain.toLowerCase())) {
              const org = await Organization.findOne({ domain: domain.toLowerCase() });
              if (org) {
                dbUser.organizationId = org._id.toString();
                updated = true;
              }
            }
          }
          
          if (updated) {
            await dbUser.save();
          }
          
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId ? dbUser.organizationId.toString() : null;
          token.status = dbUser.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || 'user';
        (session.user as any).organizationId = token.organizationId || null;
        (session.user as any).status = token.status || 'active';
      }
      return session;
    },
  },
  // Enable debug logging in development to surface SMTP/host errors
  debug: process.env.NODE_ENV !== 'production',
  pages: {
    signIn: '/sign-in',
  },
};
