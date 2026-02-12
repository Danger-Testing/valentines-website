import { Metadata } from "next";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = {
  title: "Gallery - Link Bouquet",
  description: "Browse all the beautiful bouquets created by our community",
  openGraph: {
    title: "Gallery - Link Bouquet",
    description: "Browse all the beautiful bouquets created by our community",
    images: ["/og.png"],
  },
};

export default function GalleryPage() {
  return <GalleryClient />;
}
