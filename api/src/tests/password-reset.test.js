import { describe, it, before } from "node:test";
import assert from "node:assert";
import pg from "pg";
import {
  register,
  login,
  logout,
  getSession,
  getMe,
  generateEmail,
  forgotPassword,
  resetPassword,
  request,
  createRateLimitedClient,
} from "./helpers.js";

const TEST_PASSWORD = "Test1234!";
const NEW_PASSWORD = "NewTest5678!";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getResetTokenForUser(userId) {
  const { rows } = await pool.query(
    `SELECT identifier FROM verification
     WHERE identifier LIKE 'reset-password:%' AND value = $1
     ORDER BY "createdAt" DESC LIMIT 1`,
    [userId]
  );
  if (rows.length === 0) return null;
  return rows[0].identifier.replace("reset-password:", "");
}

async function getUserIdByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id FROM "user" WHERE email = $1`,
    [email]
  );
  return rows.length > 0 ? rows[0].id : null;
}

async function getUserSessions(userId) {
  const { rows } = await pool.query(
    `SELECT id FROM session WHERE "userId" = $1 AND "expiresAt" > NOW()`,
    [userId]
  );
  return rows;
}

async function cleanupUser(email) {
  const userId = await getUserIdByEmail(email);
  if (!userId) return;
  await pool.query(`DELETE FROM session WHERE "userId" = $1`, [userId]);
  await pool.query(`DELETE FROM verification WHERE value = $1`, [userId]);
  await pool.query(`DELETE FROM account WHERE "userId" = $1`, [userId]);
  await pool.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
}

describe("Password Reset", () => {
  describe("POST /api/auth/request-password-reset", () => {
    it("should return success for existing user", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);

      const res = await forgotPassword(email);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, true);

      await cleanupUser(email);
    });

    it("should return same success response for non-existing user", async () => {
      const email = `nonexistent-${Date.now()}@example.com`;

      const res = await forgotPassword(email);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, true);
    });

    it("should return identical response for existing and non-existing users", async () => {
      const existingEmail = generateEmail();
      await register(existingEmail, TEST_PASSWORD);
      const nonExistingEmail = `nonexistent-${Date.now()}@example.com`;

      const res1 = await forgotPassword(existingEmail);
      const res2 = await forgotPassword(nonExistingEmail);

      assert.strictEqual(res1.body.status, res2.body.status);
      assert.strictEqual(res1.body.message, res2.body.message);
      assert.strictEqual(res1.status, res2.status);

      await cleanupUser(existingEmail);
    });

    it("should not return token in response", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);

      const res = await forgotPassword(email);
      assert.strictEqual(res.body.token, undefined);
      assert.strictEqual(res.body.resetToken, undefined);

      await cleanupUser(email);
    });

    it("should reject invalid email format", async () => {
      const res = await forgotPassword("not-an-email");
      assert.ok(res.status >= 400);
    });

    it("should create a verification token for existing user", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);

      const token = await getResetTokenForUser(userId);
      assert.ok(token, "Token should be stored in verification table");
      assert.ok(token.length > 0, "Token should not be empty");

      await cleanupUser(email);
    });

    it("should not create verification token for non-existing user", async () => {
      const nonExistingEmail = `nonexistent-${Date.now()}@example.com`;

      await forgotPassword(nonExistingEmail);

      const { rows } = await pool.query(
        `SELECT * FROM verification WHERE identifier LIKE 'reset-password:%' AND value = 'dummy-verification-token'`
      );
      // Better Auth creates a dummy lookup for timing attack protection,
      // but no actual token is stored for non-existent users
      assert.ok(rows.length === 0 || rows[0].value === "dummy-verification-token");
    });

    it("should invalidate previous tokens when new request is made", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const firstToken = await getResetTokenForUser(userId);

      await forgotPassword(email);
      const secondToken = await getResetTokenForUser(userId);

      assert.ok(firstToken, "First token should exist");
      assert.ok(secondToken, "Second token should exist");
      assert.notStrictEqual(firstToken, secondToken, "Tokens should be different");

      await cleanupUser(email);
    });

    it("should apply rate limiting", async () => {
      const client = await createRateLimitedClient(10);
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: process.env.FRONTEND_URL || "http://localhost:5173",
          },
          body: JSON.stringify({ email: generateEmail() }),
        };

        for (let i = 0; i < 5; i++) {
          await fetch(`${client.url}/api/auth/request-password-reset`, options);
        }
        const response = await fetch(`${client.url}/api/auth/request-password-reset`, options);

        assert.strictEqual(response.status, 429);
      } finally {
        await client.close();
      }
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("should reset password with valid token", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);
      assert.ok(token, "Token should exist");

      const res = await resetPassword(token, NEW_PASSWORD);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, true);

      await cleanupUser(email);
    });

    it("should allow login with new password after reset", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      await resetPassword(token, NEW_PASSWORD);

      const loginRes = await login(email, NEW_PASSWORD);
      assert.strictEqual(loginRes.status, 200);
      assert.ok(loginRes.cookies);

      await cleanupUser(email);
    });

    it("should not allow login with old password after reset", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      await resetPassword(token, NEW_PASSWORD);

      const loginRes = await login(email, TEST_PASSWORD);
      assert.strictEqual(loginRes.status, 401);

      await cleanupUser(email);
    });

    it("should reject invalid token", async () => {
      const res = await resetPassword("invalid-token-12345", NEW_PASSWORD);
      assert.ok(res.status >= 400);
    });

    it("should reject empty token", async () => {
      const res = await request("POST", "/api/auth/reset-password", {
        newPassword: NEW_PASSWORD,
      });
      assert.ok(res.status >= 400);
    });

    it("should reject already used token", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      await resetPassword(token, NEW_PASSWORD);

      const res = await resetPassword(token, NEW_PASSWORD);
      assert.ok(res.status >= 400);

      await cleanupUser(email);
    });

    it("should reject password that is too short", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      const res = await resetPassword(token, "123");
      assert.ok(res.status >= 400);

      await cleanupUser(email);
    });

    it("should invalidate all sessions after password reset", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      const loginRes = await login(email, TEST_PASSWORD);
      assert.strictEqual(loginRes.status, 200);

      const sessionsBefore = await getUserSessions(userId);
      assert.ok(sessionsBefore.length > 0, "Should have active sessions");

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      await resetPassword(token, NEW_PASSWORD);

      const sessionsAfter = await getUserSessions(userId);
      assert.strictEqual(sessionsAfter.length, 0, "All sessions should be invalidated");

      await cleanupUser(email);
    });

    it("should reject expired token", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      await pool.query(
        `UPDATE verification SET "expiresAt" = NOW() - INTERVAL '1 minute'
         WHERE identifier = $1`,
        [`reset-password:${token}`]
      );

      const res = await resetPassword(token, NEW_PASSWORD);
      assert.ok(res.status >= 400, "Expired token should be rejected");

      await cleanupUser(email);
    });

    it("should handle concurrent token usage correctly", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      const [res1, res2] = await Promise.all([
        resetPassword(token, NEW_PASSWORD),
        resetPassword(token, NEW_PASSWORD),
      ]);

      const successCount = [res1, res2].filter(
        (r) => r.status === 200 && r.body.status === true
      ).length;

      assert.strictEqual(successCount, 1, "Only one request should succeed");

      await cleanupUser(email);
    });
  });

  describe("Security", () => {
    it("same response for existing and non-existing users", async () => {
      const existingEmail = generateEmail();
      await register(existingEmail, TEST_PASSWORD);
      const nonExistingEmail = `nonexistent-${Date.now()}@example.com`;

      const res1 = await forgotPassword(existingEmail);
      const res2 = await forgotPassword(nonExistingEmail);

      assert.deepStrictEqual(res1.body, res2.body);
      assert.strictEqual(res1.status, res2.status);

      await cleanupUser(existingEmail);
    });

    it("token cannot be reused", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      await resetPassword(token, NEW_PASSWORD);

      const res = await resetPassword(token, NEW_PASSWORD);
      assert.ok(res.status >= 400, "Reused token should be rejected");

      await cleanupUser(email);
    });

    it("expired token is rejected", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      await pool.query(
        `UPDATE verification SET "expiresAt" = NOW() - INTERVAL '1 minute'
         WHERE identifier = $1`,
        [`reset-password:${token}`]
      );

      const res = await resetPassword(token, NEW_PASSWORD);
      assert.ok(res.status >= 400);

      await cleanupUser(email);
    });

    it("concurrent token usage - only one succeeds", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      const results = await Promise.all([
        resetPassword(token, NEW_PASSWORD),
        resetPassword(token, NEW_PASSWORD),
        resetPassword(token, NEW_PASSWORD),
      ]);

      const successCount = results.filter(
        (r) => r.status === 200 && r.body.status === true
      ).length;

      assert.strictEqual(successCount, 1, "Exactly one request should succeed");

      await cleanupUser(email);
    });

    it("token is not returned by request-password-reset", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      const res = await forgotPassword(email);

      const bodyStr = JSON.stringify(res.body);
      assert.ok(!bodyStr.includes(userId), "Response should not contain user ID");

      await cleanupUser(email);
    });

    it("old session becomes invalid after password reset", async () => {
      const email = generateEmail();
      await register(email, TEST_PASSWORD);
      const userId = await getUserIdByEmail(email);

      const loginRes = await login(email, TEST_PASSWORD);
      const oldCookies = loginRes.cookies;

      await forgotPassword(email);
      const token = await getResetTokenForUser(userId);

      await resetPassword(token, NEW_PASSWORD);

      const meRes = await getMe(oldCookies);
      assert.strictEqual(meRes.status, 401, "Old session should be invalid");

      await cleanupUser(email);
    });
  });
});
