/* eslint-disable @typescript-eslint/no-require-imports */
// Imports EasyTrip's Google Business Profile reviews (as shown in the
// Trustindex widget on easytrip.pk, Nov 2026) into CustomerReview.
// Rows are created unpublished so an admin approves each one in /admin/reviews.
// Safe to re-run: a review is skipped if the same name + text already exists.
//
//   node scripts/import-google-reviews.js           # dry run
//   node scripts/import-google-reviews.js --write   # insert
require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const pool = new Pool({
  connectionString: connectionUrl
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/[?&]pgbouncer=true/g, ""),
  ssl: /[?&]sslmode=disable\b/.test(connectionUrl) ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Text is verbatim from Google. Titles are short excerpts of each reviewer's
// own words (the homepage card shows the title, not the body).
const REVIEWS = [
  {
    customerName: "SN Jutt",
    title: "Very good experience and cooperative",
    body: "Recommended,,.I have traveled through this company,, very good experience and cooperative,, ,, remain in touch with customer for updates. I will always prefer to travel with easy trip travel & tour.",
  },
  {
    customerName: "RAAZIA IRSHAD, PhD BA",
    title: "Team was very cooperative",
    body: "It was really good experience. Team was very cooperative especially Mr. Zain services was superb.",
  },
  {
    customerName: "Muhammad Yasir",
    title: "Excellent service, highly recommended",
    body: "I'm very happy with EasyTrip services very kind and helpful many times use tire services all the time give Excellent service highly recommended they give instant service one time i stuck in airport due to my ticket issue they give me service at airport send tire stuff to airport with card swipe machine thanks EasyTrip team keep it up",
  },
  {
    customerName: "Sobia Aslam",
    title: "Very satisfied with Easy Trip",
    body: "I'm very satisfied with easy trip and travels. Miss Sidra guide me very well and all the time she is being very nice. Thanks you giving me a good services and inshallah I will get next services from you",
  },
  {
    customerName: "Ammar Munir",
    title: "Great service, quick response",
    body: "Great service, quick response, and seamless experience! Keep up the good work!",
  },
  {
    customerName: "Nauman Abbas",
    title: "Very cooperative and friendly",
    body: "Best services I’ve had …. Very cooperative and friendly…..",
  },
  {
    customerName: "Ali Abbas Fakhar",
    title: "Sincere, quick and effective",
    body: "Hamid sb is excellent and exceptional- in an emergency situation he handled things excellently and gave us a fair deal, and tried holding our ticket to see if a price drop was possible. His work is sincere, quick, effective and the best mashAllah",
  },
];

async function main() {
  const write = process.argv.includes("--write");
  let created = 0;
  let skipped = 0;

  for (const [index, review] of REVIEWS.entries()) {
    const existing = await prisma.customerReview.findFirst({
      where: { customerName: review.customerName, body: review.body },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      console.log(`skip   ${review.customerName} (already imported)`);
      continue;
    }

    console.log(`${write ? "create" : "would create"} ${review.customerName}`);
    if (write) {
      await prisma.customerReview.create({
        data: {
          ...review,
          rating: 5,
          isVerified: true,
          isPublished: false,
          sortOrder: index,
        },
      });
    }
    created += 1;
  }

  console.log(`\n${write ? "Created" : "Would create"} ${created}, skipped ${skipped}.`);
  if (!write) console.log("Dry run only. Re-run with --write to insert.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
