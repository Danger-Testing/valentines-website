import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { getAppdropRedirectUrl, proxy } from "../src/proxy.ts";

describe("Appdrop entry routing", () => {
  test("redirects a direct visit to the Appdrop LinkBouquet page", () => {
    const request = new NextRequest(
      "https://valentines-website-nine-rust.vercel.app/",
      { headers: { "sec-fetch-dest": "document" } },
    );
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.appdrop.com/marcgmbh/link-bouquet",
    );
  });

  test("keeps Appdrop iframe requests on the LinkBouquet renderer", () => {
    const request = new NextRequest(
      "https://valentines-website-nine-rust.vercel.app/?appdrop_app_id=app-1",
      { headers: { "sec-fetch-dest": "iframe" } },
    );
    const response = proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  test("preserves a legacy bouquet selection through Appdrop", () => {
    const request = new NextRequest(
      "https://valentines-website-nine-rust.vercel.app/?b=rosa-rubra-7620&appdrop_app_id=app-1",
    );
    const destination = getAppdropRedirectUrl(request);

    expect(destination.origin + destination.pathname).toBe(
      "https://www.appdrop.com/marcgmbh/link-bouquet",
    );
    expect(destination.searchParams.get("url")).toBe(
      "https://valentines-website-nine-rust.vercel.app/?b=rosa-rubra-7620",
    );
  });

  test("carries an Appdrop output selection to the parent page", () => {
    const request = new NextRequest(
      "https://valentines-website-nine-rust.vercel.app/?appdrop_output_id=output-1",
    );

    expect(
      getAppdropRedirectUrl(request).searchParams.get("appdrop_output_id"),
    ).toBe("output-1");
  });
});
