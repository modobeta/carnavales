import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { Pool } from "pg";
import { twoFactor } from "better-auth/plugins";
import {
  emailService,
  sendPasswordResetEmail,
} from "../services/email.service.js";
import { otpEmail } from "../services/email-templates.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: Number(process.env.PASSWORD_RESET_TOKEN_TTL) || 1800,
    sendResetPassword: async ({ user, token }) => {
      await sendPasswordResetEmail({ user, token });
    },
    onPasswordReset: async ({ user }, request) => {
      // Intentionally minimal - no sensitive data logged
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/two-factor/verify-otp") return;

      const verifiedSession = ctx.context.newSession;
      if (!verifiedSession?.user?.twoFactorEnabled) return;

      const sessions = await ctx.context.internalAdapter.listSessions(
        verifiedSession.user.id,
      );
      const staleTokens = sessions
        .map((session) => session.token)
        .filter((token) => token !== verifiedSession.session.token);

      if (staleTokens.length > 0) {
        await ctx.context.internalAdapter.deleteSessions(staleTokens);
      }
    }),
  },
  plugins: [
    twoFactor({
      skipVerificationOnEnable: false,
      otpOptions: {
        storeOTP: "encrypted",
        async sendOTP({ user, otp }) {
          await emailService.send({
            to: user.email,
            subject: "Tu código de verificación - Carnavales",
            otp,
            html: otpEmail({ otp }),
          });
        },
      },
    }),
  ],
});
