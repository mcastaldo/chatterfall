/**
 * Seed bot users into the database.
 * Run once: npm run db:seed
 * Safe to re-run — uses upsert so existing bots are left unchanged.
 */
import { PrismaClient } from "@prisma/client";
import { BOT_DEFINITIONS } from "../src/lib/botData";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${BOT_DEFINITIONS.length} bot users...`);

  for (const bot of BOT_DEFINITIONS) {
    const result = await prisma.user.upsert({
      where: { email: bot.email },
      update: {}, // don't overwrite if already exists
      create: {
        username: bot.username,
        displayName: bot.displayName,
        email: bot.email,
        passwordHash: bot.passwordHash,
        verified: false,
      },
    });
    console.log(`  ✓ ${result.displayName} (@${result.username}) — ${result.id}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
