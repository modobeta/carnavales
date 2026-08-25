import { after } from "node:test";
import { once } from "node:events";
import { createApp } from "../server.js";

const ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";

const server = createApp({ rateLimitEnabled: false }).listen(0, "127.0.0.1");
await once(server, "listening");

const address = server.address();
const BASE_URL = `http://127.0.0.1:${address.port}`;

after(async () => {
  server.close();
  await once(server, "close");
});

function parseSetCookies(headers) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean);

  return values.map((value) => value.split(";", 1)[0]);
}

function mergeCookies(currentCookies, newCookies) {
  const jar = new Map();

  for (const cookie of currentCookies.split("; ").filter(Boolean)) {
    const separator = cookie.indexOf("=");
    jar.set(cookie.slice(0, separator), cookie.slice(separator + 1));
  }

  for (const cookie of newCookies) {
    const separator = cookie.indexOf("=");
    const name = cookie.slice(0, separator);
    const value = cookie.slice(separator + 1);
    if (value) jar.set(name, value);
    else jar.delete(name);
  }

  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

export async function request(method, path, body = null, cookies = "") {
  const headers = {
    "Content-Type": "application/json",
    "Origin": ORIGIN,
    "Referer": ORIGIN,
  };

  if (cookies) {
    headers["Cookie"] = cookies;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  const allCookies = mergeCookies(cookies, parseSetCookies(response.headers));

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    status: response.status,
    headers: response.headers,
    body: data,
    cookies: allCookies,
  };
}

let lastRequestTime = 0;

async function throttledRequest(method, path, body = null, cookies = "") {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < 200) {
    await new Promise((resolve) => setTimeout(resolve, 200 - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  return request(method, path, body, cookies);
}

export async function register(email, password, firstName = "Test", lastName = "User") {
  return throttledRequest("POST", "/api/auth/sign-up/email", {
    email,
    password,
    name: `${firstName} ${lastName}`,
  });
}

export async function login(email, password) {
  return throttledRequest("POST", "/api/auth/sign-in/email", {
    email,
    password,
  });
}

export async function logout(cookies) {
  return throttledRequest("POST", "/api/auth/sign-out", null, cookies);
}

export async function getSession(cookies) {
  return request("GET", "/api/auth/get-session", null, cookies);
}

export async function getMe(cookies) {
  return request("GET", "/api/me", null, cookies);
}

export function generateEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

export async function createRateLimitedClient(max = 2) {
  const rateLimitedServer = createApp({ authRateLimitMax: max }).listen(0, "127.0.0.1");
  await once(rateLimitedServer, "listening");
  const rateLimitedAddress = rateLimitedServer.address();

  return {
    url: `http://127.0.0.1:${rateLimitedAddress.port}`,
    async close() {
      rateLimitedServer.close();
      await once(rateLimitedServer, "close");
    },
  };
}

export async function forgotPassword(email) {
  return throttledRequest("POST", "/api/auth/request-password-reset", { email });
}

export async function resetPassword(token, newPassword) {
  return throttledRequest("POST", "/api/auth/reset-password", { newPassword, token });
}
