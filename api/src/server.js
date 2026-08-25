import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/auth.js";
import protectedRoutes from "./routes/protected.routes.js";

const PORT = process.env.PORT || 3000;

export function createApp({ rateLimitEnabled = true, authRateLimitMax = 10 } = {}) {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

  app.use(helmet());

  if (rateLimitEnabled) {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: authRateLimitMax,
      message: { error: "Too many attempts. Please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(
      ["/api/auth/sign-in/email", "/api/auth/sign-up/email"],
      authLimiter
    );

    const passwordResetLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { error: "Too many attempts. Please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(
      ["/api/auth/request-password-reset", "/api/auth/reset-password"],
      passwordResetLimiter
    );
  }

  app.all("/api/auth/*", toNodeHandler(auth));

  app.use(express.json());

  app.use("/api", protectedRoutes);

  app.use((err, req, res, next) => {
    console.error("Unexpected error:", err);
    const statusCode = err.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
    return res.status(statusCode).json({ error: message });
  });

  return app;
}

const app = createApp();

async function start() {
  try {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    await pool.query("SELECT 1");
    await pool.end();
    console.log("Database connected.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start();
}

export default app;
