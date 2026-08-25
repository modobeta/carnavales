import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth/auth.js";

export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.session = session;
    req.user = session.user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireTwoFactor(req, res, next) {
  if (req.user?.twoFactorEnabled !== true) {
    return res.status(403).json({
      error: "Two-factor authentication setup required",
      code: "TWO_FACTOR_REQUIRED",
    });
  }

  next();
}
