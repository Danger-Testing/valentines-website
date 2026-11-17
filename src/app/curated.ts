import type { MediaType } from "@/lib/supabase";

type CuratedBucket = {
  name: string;
  pfp: string;
  link: string;
  media: { type: MediaType; mediaId: string; label: string }[];
};

// Precurated media items for the sidebar, one bucket per curator
export const CURATED_BUCKETS: CuratedBucket[] = [
  {
    name: "marc",
    pfp: "/pfp.jpg",
    link: "https://x.com/marcgmbh",
    media: [
      {
        type: "spotify",
        mediaId: "track/3gighwbMyIfJKVpauvANY2",
        label: "The City Never Felt So Good - 1tbsp",
      },
      {
        type: "spotify",
        mediaId: "track/1RAiHhh4HfUgcA1ATlg9yA",
        label: "Comin Home - Jespfur & Paula",
      },
      {
        type: "letterboxd",
        mediaId: "https://letterboxd.com/film/tar-2022/",
        label: "Tár (2022)",
      },
      {
        type: "youtube",
        mediaId: "drb-tch9o74",
        label: "WHITE TEE [INCREDIBLE VIBES DISCOVERED]",
      },
      {
        type: "youtube",
        mediaId: "5U4S4ki4YZs",
        label: "Why Humans Create",
      },
      {
        type: "substack",
        mediaId: "https://www.frederikjournals.com/p/the-way-south",
        label: "The Way South",
      },
      {
        type: "link",
        mediaId: "https://magazine.032c.com/magazine/michel-majerus",
        label: "Michel Majerus - 032c",
      },
      {
        type: "letterboxd",
        mediaId: "https://letterboxd.com/film/babylon-2022/",
        label: "Babylon (2022)",
      },
      {
        type: "instagram",
        mediaId: "DLihxUgsawm",
        label: "Instagram",
      },
      {
        type: "instagram",
        mediaId: "DLkKDr1MnXg",
        label: "Instagram",
      },
      {
        type: "spotify",
        mediaId: "track/4E7H6rqgxHdSoeGSS28CTY",
        label: "Benz Friendz - Future ft. André 3000",
      },
      {
        type: "youtube",
        mediaId: "B5kFBFp-9H0",
        label: "YouTube",
      },
      {
        type: "spotify",
        mediaId: "track/2M9ro2krNb7nr7HSprkEgo",
        label: "Fast Car - Tracy Chapman",
      },
      {
        type: "youtube",
        mediaId: "2Dpd_8n3A5U",
        label: "FILMMAKING IS A SPORT",
      },
      {
        type: "youtube",
        mediaId: "pqzcCfUglws",
        label: "The Psychology of Human Misjudgement - Charlie Munger",
      },
      {
        type: "youtube",
        mediaId: "0fKBhvDjuy0",
        label: "Powers of Ten™ (1977)",
      },
      {
        type: "substack",
        mediaId: "https://www.henrikkarlsson.xyz/p/looking-for-alice",
        label: "Looking for Alice",
      },
    ],
  },
  {
    name: "reggie",
    pfp: "/reggie.jpg",
    link: "https://x.com/HipCityReg",
    media: [
      {
        type: "spotify",
        mediaId: "track/5s1mZcxqYhgmlvDxg4IGwt",
        label: "Alma - Jonny Greenwood",
      },
      {
        type: "link",
        mediaId: "https://www.newyorker.com/magazine/2016/10/10/sam-altmans-manifest-destiny",
        label: "Sam Altman's Manifest Destiny",
      },
      {
        type: "youtube",
        mediaId: "xhf5bHtf4jk",
        label: "Rare Wine Tasting in the French Countryside",
      },
    ],
  },
  {
    name: "mike",
    pfp: "/mike.jpg",
    link: "https://x.com/immike_wing",
    media: [
      {
        type: "youtube",
        mediaId: "JJxHRnPxmBI",
        label: "Snoopy | Be My Valentine",
      },
      {
        type: "spotify",
        mediaId: "track/1Vk4yRsz0iBzDiZEoFMQyv",
        label: "Mia & Sebastian's Theme - Justin Hurwitz",
      },
      {
        type: "substack",
        mediaId: "https://substack.com/home/post/p-187048525",
        label: "To Be Loved Is to Be Changed",
      },
    ],
  },
  {
    name: "anna",
    pfp: "/anna.JPG",
    link: "https://x.com/hard_boiledbabe",
    media: [
      {
        type: "letterboxd",
        mediaId: "https://letterboxd.com/film/wild-at-heart/",
        label: "Wild at Heart",
      },
      {
        type: "substack",
        mediaId: "https://chiasm.substack.com/p/so-much-longing-in-so-little-space",
        label: "So Much Longing in So Little Space",
      },
      {
        type: "youtube",
        mediaId: "mHQmnumnNgo",
        label: "Triadisches Ballett von Oskar Schlemmer - Bauhaus (Best Quality)",
      },
      {
        type: "youtube",
        mediaId: "nLCY5Wl6ZMA",
        label: "Bajka [A Fairy Tale] - Poland, 1968",
      },
      {
        type: "spotify",
        mediaId: "playlist/3vDFi3Ggjv9xoLLbbSWvQR",
        label: "i have just now come from a party where i was its life and soul. everyon laughed and admired me",
      },
      {
        type: "youtube",
        mediaId: "npol_Y-expQ",
        label: "Angel (Joseph Cornell, 1957)",
      },
      {
        type: "spotify",
        mediaId: "track/1APu9lSrXWUarvP61myILk",
        label: "blue valentines by tom waits",
      },
    ],
  },
  {
    name: "liz",
    pfp: "/liz.png",
    link: "https://www.instagram.com/lizmontesano/",
    media: [
      {
        type: "link",
        mediaId: "https://unewsonline.com/2024/10/the-history-and-legacy-of-one-direction/",
        label: "The history and legacy of One Direction",
      },
      {
        type: "link",
        mediaId: "https://onedirection.tumblr.com/",
        label: "One Direction on Tumblr",
      },
      {
        type: "link",
        mediaId: "https://www.bbc.com/news/entertainment-arts-53470098",
        label: "In pictures: 10 years of One Direction",
      },
      {
        type: "youtube",
        mediaId: "syFZfO_wfMQ",
        label: "One Direction - Night Changes",
      },
      {
        type: "youtube",
        mediaId: "QJO3ROT-A4E",
        label: "One Direction - What Makes You Beautiful",
      },
    ],
  },
  {
    name: "lelix",
    pfp: "/lelix.jpg",
    link: "https://www.instagram.com/lelix.jet/",
    media: [
      {
        type: "youtube",
        mediaId: "sAQHr-pnrQo",
        label: "Shrek's Best Scenes",
      },
      {
        type: "spotify",
        mediaId: "track/13toFl1UwJPsRxDiD9jgtn",
        label: "As - Stevie Wonder",
      },
      {
        type: "link",
        mediaId: "https://www.flickr.com/photos/henrylizardlover/3279951706/",
        label: "Flickr Photo",
      },
      {
        type: "letterboxd",
        mediaId: "https://letterboxd.com/film/interstellar/",
        label: "Interstellar (2014)",
      },
    ],
  },
  {
    name: "ceci",
    pfp: "/ceci.jpg",
    link: "https://www.instagram.com/ceciliaazcarate/",
    media: [
      {
        type: "link",
        mediaId: "https://ceciliaazcarate.com/",
        label: "Cecilia Azcarate",
      },
      {
        type: "youtube",
        mediaId: "nFWgiZxnz7o",
        label: "Koudlam - See You All",
      },
      {
        type: "link",
        mediaId: "https://bitcoin.org/bitcoin.pdf",
        label: "Bitcoin Whitepaper",
      },
      {
        type: "youtube",
        mediaId: "MoXrMOsnRVo",
        label: "Tous Les Matins du Monde - Improvisation sur les Folies",
      },
      {
        type: "link",
        mediaId: "https://artsandculture.google.com/asset/EQFVNZZUaQNQQA",
        label: "Stanley Kubrick - Barry Lyndon Portrait",
      },
      {
        type: "link",
        mediaId: "https://artsandculture.google.com/asset/the-annunciation-jan-van-eyck/xwFVdn0XxLmf9Q",
        label: "The Annunciation - Jan van Eyck",
      },
      {
        type: "youtube",
        mediaId: "s5MUxuY4Hbw",
        label: "The shooting paintings of Niki de Saint Phalle",
      },
    ],
  },
];
