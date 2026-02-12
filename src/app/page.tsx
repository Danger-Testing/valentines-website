import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import HomeClient from "./HomeClient";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const slug = params.b as string | undefined;

  // Default metadata
  const defaultMetadata: Metadata = {
    title: "Link Bouquet",
    description: "Create and share beautiful bouquets of your favorite links",
    openGraph: {
      title: "Link Bouquet",
      description: "Create and share beautiful bouquets of your favorite links",
      images: ["/og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Link Bouquet",
      description: "Create and share beautiful bouquets of your favorite links",
      images: ["/og.png"],
    },
  };

  if (!slug || !supabaseUrl || !supabaseAnonKey) {
    return defaultMetadata;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from("bouquets")
      .select("from_name, to_name")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return defaultMetadata;
    }

    const fromName = data.from_name || "";
    const toName = data.to_name || "";

    // Generate dynamic OG image URL with names
    const ogImageUrl = `/api/og/bouquet?from=${encodeURIComponent(fromName)}&to=${encodeURIComponent(toName)}`;

    const title = fromName && toName
      ? `Link Bouquet from ${fromName} to ${toName}`
      : "Link Bouquet";
    const description = fromName && toName
      ? `${fromName} curated a bouquet of links for ${toName}`
      : "Create and share beautiful bouquets of your favorite links";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [ogImageUrl],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return defaultMetadata;
  }
}

export default function Page() {
  return <HomeClient />;
}
