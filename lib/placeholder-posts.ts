// Temporary local placeholder data for visual development of the feed.
// Not connected to any backend — replace with real post data later.

export type Post = {
  id: string;
  username: string;
  caption: string;
  date: string;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
};

export const placeholderPosts: Post[] = [
  {
    id: "1",
    username: "marlowe.eaves",
    caption:
      "Slow mornings in the studio. There's a particular kind of quiet before the light changes.",
    date: "Sept 20",
    imageSrc: "/placeholders/photo-1.svg",
    imageWidth: 1200,
    imageHeight: 1500,
    imageAlt: "Soft sage and clay toned abstract composition",
  },
  {
    id: "2",
    username: "juno.field",
    caption: "Coastline, an hour past sunrise. Salt air and not much else.",
    date: "Sept 19",
    imageSrc: "/placeholders/photo-2.svg",
    imageWidth: 1600,
    imageHeight: 1067,
    imageAlt: "Muted dusk blue and clay toned landscape composition",
  },
  {
    id: "3",
    username: "arlo.penn",
    caption: "Still life, revisited. Same table, different year.",
    date: "Sept 17",
    imageSrc: "/placeholders/photo-3.svg",
    imageWidth: 1200,
    imageHeight: 1200,
    imageAlt: "Warm terracotta and sage toned square composition",
  },
  {
    id: "4",
    username: "wren.oslund",
    caption:
      "Found this stairwell on a walk through the old quarter. Kept going back for the light.",
    date: "Sept 15",
    imageSrc: "/placeholders/photo-4.svg",
    imageWidth: 1400,
    imageHeight: 1750,
    imageAlt: "Cool blue and warm clay toned portrait composition",
  },
  {
    id: "5",
    username: "dax.moreau",
    caption: "Closing shift. The kitchen after everyone leaves.",
    date: "Sept 13",
    imageSrc: "/placeholders/photo-5.svg",
    imageWidth: 1600,
    imageHeight: 900,
    imageAlt: "Dark moody wide composition with warm accents",
  },
  {
    id: "6",
    username: "iris.tanaka",
    caption: "Greenhouse in October. Everything still growing, somehow.",
    date: "Sept 11",
    imageSrc: "/placeholders/photo-6.svg",
    imageWidth: 1300,
    imageHeight: 1625,
    imageAlt: "Cool sage and dusk blue toned portrait composition",
  },
];
