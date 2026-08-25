import { describe, it } from "node:test";
import assert from "node:assert";
import * as emailModule from "../services/email.service.js";

describe("Email service", () => {
  it("delivers an OTP through the console adapter only in development", async () => {
    assert.strictEqual(typeof emailModule.createEmailService, "function");

    const messages = [];
    const service = emailModule.createEmailService({
      env: { EMAIL_PROVIDER: "console", NODE_ENV: "development" },
      logger: { log: (message) => messages.push(String(message)) },
    });

    await service.send({
      to: "user@example.com",
      subject: "Código de verificación",
      html: "<p>Tu código es 123456</p>",
      otp: "123456",
    });

    assert.ok(messages.some((message) => message.includes("123456")));
  });

  it("fails closed when the console adapter is selected in production", async () => {
    const service = emailModule.createEmailService({
      env: { EMAIL_PROVIDER: "console", NODE_ENV: "production" },
      logger: { log: () => {} },
    });

    await assert.rejects(
      service.send({
        to: "user@example.com",
        subject: "Código de verificación",
        html: "<p>Tu código es 123456</p>",
        otp: "123456",
      }),
      /SMTP debe estar configurado en producción/,
    );
  });

  it("does not expose account existence when password-reset delivery fails", async () => {
    assert.strictEqual(typeof emailModule.sendPasswordResetEmail, "function");

    const errors = [];
    const sent = await emailModule.sendPasswordResetEmail(
      { user: { email: "existing@example.com" }, token: "sensitive-token" },
      {
        env: { FRONTEND_URL: "https://carnavales.example" },
        service: { send: async () => { throw new Error("SMTP unavailable"); } },
        logger: { error: (message) => errors.push(String(message)) },
      },
    );

    assert.strictEqual(sent, false);
    assert.deepStrictEqual(errors, ["Password reset email delivery failed"]);
    assert.ok(!errors.join(" ").includes("existing@example.com"));
    assert.ok(!errors.join(" ").includes("sensitive-token"));
  });
});
