import { describe, it } from "node:test";
import assert from "node:assert";
import { enableRequiredTwoFactor } from "./enable-two-factor.js";

describe("Required two-factor activation", () => {
  it("fails closed when the API cannot enable 2FA", async () => {
    const fetchImpl = async () => ({ ok: false, status: 500 });

    await assert.rejects(
      enableRequiredTwoFactor({
        apiBase: "http://localhost:3000",
        password: "Test1234!",
        fetchImpl,
      }),
      /No se pudo activar la verificación en dos pasos/,
    );
  });

  it("sends credentials and the password when enabling 2FA", async () => {
    let received;
    const fetchImpl = async (url, options) => {
      received = { url, options };
      return { ok: true };
    };

    await enableRequiredTwoFactor({
      apiBase: "http://localhost:3000",
      password: "Test1234!",
      fetchImpl,
    });

    assert.strictEqual(received.url, "http://localhost:3000/api/enable-2fa");
    assert.strictEqual(received.options.credentials, "include");
    assert.deepStrictEqual(JSON.parse(received.options.body), { password: "Test1234!" });
  });
});
