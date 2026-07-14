import { describe, expect, test } from "bun:test";

import { subscribeThenHandoff } from "./appdrop-subscribe-handoff.ts";

describe("LinkBouquet Subscribe handoff", () => {
  test("hands off only after the existing subscription succeeds", async () => {
    const events = [];
    let handoffOptions;

    const didHandoff = await subscribeThenHandoff({
      assign: () => events.push("assign"),
      email: "fan@example.com",
      follow: {
        handoff(options) {
          events.push("handoff");
          handoffOptions = options;
        },
      },
      async subscribe() {
        events.push("subscribe");
        return { ok: true };
      },
    });

    expect(didHandoff).toBe(true);
    expect(events).toEqual(["subscribe", "handoff"]);
    expect(handoffOptions).toEqual({
      contact: "fan@example.com",
      creator: "marcgmbh",
      method: "email",
      source: "linkbouquet",
    });
  });

  test("uses buildUrl and location assignment for the production fallback", async () => {
    const assigned = [];

    await subscribeThenHandoff({
      assign: (url) => assigned.push(url),
      email: "fan@example.com",
      follow: {
        buildUrl(options) {
          return new URL(
            `/marcgmbh?follow=1&contact_method=${options.method}&email=${options.contact}&source=${options.source}`,
            "https://www.appdrop.com",
          );
        },
      },
      async subscribe() {
        return { ok: true };
      },
    });

    expect(assigned).toEqual([
      "https://www.appdrop.com/marcgmbh?follow=1&contact_method=email&email=fan@example.com&source=linkbouquet",
    ]);
  });

  test("does not hand off or navigate when the subscription fails", async () => {
    const events = [];

    const didHandoff = await subscribeThenHandoff({
      assign: () => events.push("assign"),
      email: "fan@example.com",
      follow: {
        buildUrl() {
          events.push("buildUrl");
          return new URL("https://www.appdrop.com/marcgmbh");
        },
        handoff() {
          events.push("handoff");
        },
      },
      async subscribe() {
        events.push("subscribe");
        return { ok: false };
      },
    });

    expect(didHandoff).toBe(false);
    expect(events).toEqual(["subscribe"]);
  });

  test("does not navigate when the subscription request rejects", async () => {
    const events = [];

    await expect(
      subscribeThenHandoff({
        assign: () => events.push("assign"),
        email: "fan@example.com",
        follow: {
          handoff() {
            events.push("handoff");
          },
        },
        async subscribe() {
          events.push("subscribe");
          throw new Error("Subscription failed");
        },
      }),
    ).rejects.toThrow("Subscription failed");

    expect(events).toEqual(["subscribe"]);
  });
});
