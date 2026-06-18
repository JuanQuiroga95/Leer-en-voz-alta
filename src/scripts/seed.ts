import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Limpiando base de datos...');
  await prisma.readingProgress.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.trophy.deleteMany();
  await prisma.text.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creando usuarios demo...');
  const password = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      legajo: 'admin',
      password,
      name: 'Admin Demo',
      role: 'ADMIN',
    },
  });

  const profesor = await prisma.user.create({
    data: {
      legajo: 'profesor',
      password,
      name: 'Profe Demo',
      role: 'PROFESOR',
      division: '2° 1ra',
    },
  });

  const alumno = await prisma.user.create({
    data: {
      legajo: 'alumno',
      password,
      name: 'Alumno Demo',
      role: 'ALUMNO',
      division: '2° 1ra',
    },
  });

  console.log('Creando textos y retos demo...');
  const texto = await prisma.text.create({
    data: {
      title: 'El León y el Ratón',
      author: 'Esopo',
      level: 'Básico',
      year: 2,
      content: 'Un día, un pequeño ratón corrió sobre el cuerpo dormido de un poderoso león y lo despertó. El león lo atrapó con su enorme garra y rugió: "¡Serás mi almuerzo!". El ratón, temblando, suplicó: "¡Por favor, perdóname! Algún día te podré ayudar." El león soltó una carcajada, pero lo dejó libre. Días después, unos cazadores atraparon al león con una red. El ratón escuchó sus rugidos y corrió hasta él. Con sus pequeños dientes cortó la red y liberó al rey de la selva. Moraleja: Los actos de bondad nunca se pierden, y el más pequeño puede ayudar al más grande.',
      challenges: {
        create: [
          {
            question: '¿Por qué el león perdonó al ratón al principio?',
            options: JSON.stringify(['Porque tenía miedo', 'Porque le causó gracia', 'Porque no tenía hambre']),
            correctIdx: 1,
          },
          {
            question: '¿Qué nos enseña la moraleja?',
            options: JSON.stringify(['Los poderosos ganan', 'La bondad se devuelve', 'Los ratones son listos']),
            correctIdx: 1,
          }
        ]
      }
    }
  });

  console.log('¡Base de datos populada exitosamente!');
  console.log('------------------------------------');
  console.log('Credenciales de acceso:');
  console.log('Admin: admin / 123456');
  console.log('Profe: profesor / 123456');
  console.log('Alumno: alumno / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
