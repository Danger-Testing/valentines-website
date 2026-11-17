import { Metadata } from "next";
import { loadBouquet } from "@/lib/supabase";
import HomeClient from "./HomeClient";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function buildMetadata(
  title: string,
  description: string,
  image: string,
): Metadata {
  return {
    title,
    description,
    openGraph: { title, description, images: [image] },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

const DEFAULT_TITLE = "Link Bouquet";
const DEFAULT_DESCRIPTION =
  "Create and share beautiful bouquets of your favorite links";

const defaultMetadata = buildMetadata(
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  "/og.png",
);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const slug = (await searchParams).b as string | undefined;
  if (!slug) return defaultMetadata;

  try {
    const bouquet = await loadBouquet(slug);
    if ("error" in bouquet) return defaultMetadata;

    const fromName = bouquet.from_name || "";
    const toName = bouquet.to_name || "";

    // Dynamic OG image with both names
    const ogImageUrl = `/api/og/bouquet?from=${encodeURIComponent(fromName)}&to=${encodeURIComponent(toName)}`;

    if (!fromName || !toName) {
      return buildMetadata(DEFAULT_TITLE, DEFAULT_DESCRIPTION, ogImageUrl);
    }

    return buildMetadata(
      `Link Bouquet from ${fromName} to ${toName}`,
      `${fromName} curated a bouquet of links for ${toName}`,
      ogImageUrl,
    );
  } catch {
    return defaultMetadata;
  }
}

export default function Page() {
  return <HomeClient />;
}
