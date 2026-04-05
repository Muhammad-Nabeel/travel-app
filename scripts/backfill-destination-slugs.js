const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function toSlug(value) {
  return (
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "destination"
  );
}

async function uniqueSlug(base, currentId) {
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await prisma.destination.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}

async function main() {
  const rows = await prisma.destination.findMany({
    select: { id: true, city: true, slug: true },
  });

  let updated = 0;

  for (const row of rows) {
    const base = toSlug(row.city);
    const nextSlug = await uniqueSlug(base, row.id);

    if (row.slug !== nextSlug) {
      await prisma.destination.update({
        where: { id: row.id },
        data: { slug: nextSlug },
      });
      updated += 1;
    }
  }

  console.log(`updated=${updated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
