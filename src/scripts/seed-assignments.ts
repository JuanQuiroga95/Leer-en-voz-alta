import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding assignments...");

  // Generate all school divisions
  const years1to3 = ["1°", "2°", "3°"];
  const years4to5 = ["4°", "5°"];
  const div5 = ["1ra", "2da", "3ra", "4ta", "5ta"];
  const div4 = ["1ra", "2da", "3ra", "4ta"];

  const allDivisions: string[] = [];
  years1to3.forEach(y => div5.forEach(d => allDivisions.push(`${y} ${d}`)));
  years4to5.forEach(y => div4.forEach(d => allDivisions.push(`${y} ${d}`)));

  console.log(`Generated ${allDivisions.length} divisions.`);

  // Get all texts
  const texts = await prisma.text.findMany();
  if (texts.length < 3) {
    console.error("Not enough texts to seed assignments (need at least 3). Run seed-texts.ts first.");
    process.exit(1);
  }

  // Clear existing division assignments to prevent duplicates
  await prisma.textAssignment.deleteMany({
    where: {
      userId: null,
      division: { not: null }
    }
  });

  const assignmentsToCreate = [];

  for (const division of allDivisions) {
    // Pick 3 texts (for simplicity, we just use the first 3 or shuffle)
    const shuffledTexts = [...texts].sort(() => 0.5 - Math.random());
    const selectedTexts = shuffledTexts.slice(0, 3);

    // 2 Practice, 1 Evaluation
    assignmentsToCreate.push({
      textId: selectedTexts[0].id,
      mode: 'PRACTICA',
      division: division
    });
    assignmentsToCreate.push({
      textId: selectedTexts[1].id,
      mode: 'PRACTICA',
      division: division
    });
    assignmentsToCreate.push({
      textId: selectedTexts[2].id,
      mode: 'EVALUACION',
      division: division
    });
  }

  await prisma.textAssignment.createMany({
    data: assignmentsToCreate
  });

  console.log(`✅ Seeded ${assignmentsToCreate.length} assignments successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
