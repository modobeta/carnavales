import { describe, it } from "node:test";
import assert from "node:assert";
import { request, register, login, getMe, generateEmail, createRateLimitedClient } from "./helpers.js";

describe("Security", () => {
  describe("Rate Limiting", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      const client = await createRateLimitedClient(2);
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: process.env.FRONTEND_URL || "http://localhost:5173",
          },
          body: JSON.stringify({ email: generateEmail(), password: "wrongpassword" }),
        };

        await fetch(`${client.url}/api/auth/sign-in/email`, options);
        await fetch(`${client.url}/api/auth/sign-in/email`, options);
        const response = await fetch(`${client.url}/api/auth/sign-in/email`, options);

        assert.strictEqual(response.status, 429);

        const sessionResponse = await fetch(`${client.url}/api/auth/get-session`, {
          headers: { Origin: process.env.FRONTEND_URL || "http://localhost:5173" },
        });
        assert.strictEqual(sessionResponse.status, 200);
      } finally {
        await client.close();
      }
    });
  });

  describe("SQL Injection", () => {
    it("should not allow SQL injection in login", async () => {
      const res = await login("' OR '1'='1", "' OR '1'='1");

      assert.ok(res.status >= 400);
      assert.ok(!res.body.data?.session);
    });

    it("should not allow SQL injection in email field", async () => {
      const res = await login("admin'--", "password");

      assert.ok(res.status >= 400);
    });
  });

  describe("User Enumeration", () => {
    it("should return same error for non-existent and wrong password", async () => {
      const email = generateEmail();
      await register(email, "Test1234!");

      const res1 = await login(email, "wrongpassword");
      const res2 = await login("nonexistent-" + Date.now() + "@example.com", "wrongpassword");

      assert.strictEqual(res1.body.error, res2.body.error);
    });
  });

  describe("Input Validation", () => {
    it("should reject empty body on login", async () => {
      const res = await request("POST", "/api/auth/sign-in/email", {});

      assert.ok(res.status >= 400);
    });

    it("should reject invalid email format", async () => {
      const res = await login("not-an-email", "password123");

      assert.ok(res.status >= 400);
    });
  });

  describe("Protected Routes", () => {
    it("should return 401 for /api/me without session", async () => {
      const res = await getMe("");

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, "Authentication required");
    });

    it("should not expose sensitive data in error responses", async () => {
      const res = await getMe("");

      assert.ok(!res.body.stack);
      assert.ok(!res.body.query);
      assert.ok(!res.body.internal);
    });
  });

  describe("Headers", () => {
    it("should have security headers from Helmet", async () => {
      const res = await request("GET", "/api/health");

      assert.ok(res.headers.get("x-content-type-options"));
      assert.ok(res.headers.get("x-frame-options"));
    });
  });

  describe("CORS", () => {
    it("should have CORS headers", async () => {
      const res = await request("GET", "/api/health");

      assert.ok(res.headers.get("access-control-allow-origin"));
    });
  });

  describe("Health Check", () => {
    it("should return ok status", async () => {
      const res = await request("GET", "/api/health");

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, "ok");
      assert.ok(res.body.timestamp);
    });
  });
});
