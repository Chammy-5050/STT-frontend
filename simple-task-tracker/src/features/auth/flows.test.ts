import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { flowError, inboxUrl, maskEmail } from "@/features/auth/flows";

describe("auth flow helpers", () => {
  it("masks an address as first character, *** and the domain", () => {
    expect(maskEmail("kenneth@mail.com")).toBe("k***@mail.com");
    expect(maskEmail("a@b.co")).toBe("a***@b.co");
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });

  it("opens the provider's web inbox for known domains and the mail app otherwise", () => {
    expect(inboxUrl("me@gmail.com")).toBe("https://mail.google.com/mail/u/0/#inbox");
    expect(inboxUrl("me@Outlook.com")).toBe("https://outlook.live.com/mail/0/inbox");
    expect(inboxUrl("me@hotmail.co.uk")).toBe("https://outlook.live.com/mail/0/inbox");
    expect(inboxUrl("me@yahoo.com")).toBe("https://mail.yahoo.com/");
    expect(inboxUrl("me@company.co.tz")).toBe("mailto:");
  });

  it("turns rate limits and outages into readable messages", () => {
    expect(flowError(new ApiError("Request was throttled. Expected available in 1800 seconds.", 429))).toBe("Too many attempts. Try again in 30 minutes.");
    expect(flowError(new ApiError("Request was throttled. Expected available in 20 seconds.", 429))).toBe("Too many attempts. Try again in 1 minute.");
    expect(flowError(new ApiError("down", 0))).toMatch(/couldn't reach the server/);
    expect(flowError(new ApiError("bad", 400, { code: "That code is incorrect." }))).toBe("That code is incorrect.");
  });
});
