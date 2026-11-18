import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const APPDROP_LINK_BOUQUET_URL =
  "https://www.appdrop.com/marcgmbh/link-bouquet";

function isSubresourceOrEmbeddedDocument(request: NextRequest) {
  const destination = request.headers.get("sec-fetch-dest");

  // Appdrop owns the top-level page and loads LinkBouquet as an iframe. Keep
  // iframe and client-side/data requests working, while moving direct browser
  // navigations ("document") and headerless crawlers to Appdrop.
  return Boolean(destination && destination !== "document");
}

export function getAppdropRedirectUrl(request: NextRequest) {
  const destination = new URL(APPDROP_LINK_BOUQUET_URL);
  const source = request.nextUrl.clone();
  const outputId = source.searchParams.get("appdrop_output_id");

  source.searchParams.delete("appdrop_app_id");
  source.searchParams.delete("appdrop_app_slug");
  source.searchParams.delete("appdrop_output_id");

  if (outputId) {
    destination.searchParams.set("appdrop_output_id", outputId);
  }

  // Legacy bouquet links use ?b=<slug>. Pass the original app URL through
  // Appdrop's supported frame override so the selected bouquet still opens.
  if (source.searchParams.has("b")) {
    destination.searchParams.set("url", source.toString());
  }

  return destination;
}

export function proxy(request: NextRequest) {
  if (isSubresourceOrEmbeddedDocument(request)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(getAppdropRedirectUrl(request), 307);
}

export const config = {
  matcher: ["/", "/gallery"],
};
