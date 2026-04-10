import { PrismaClient, AuthProvider, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import {
    referenceCategories,
    referenceCities,
    referenceSubscriptionPlans,
} from '../src/modules/reference-data/referenceData.data.ts';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedCities() {
    for (const city of referenceCities) {
        await prisma.city.upsert({
            where: { slug: city.slug },
            update: {
                name: city.name,
                countryCode: city.countryCode,
                isActive: city.isActive,
            },
            create: city,
        });
    }

    console.log('Seeded cities');
}

async function seedCategories() {
    for (const category of referenceCategories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: {
                name: category.name,
                description: category.description,
                isActive: category.isActive,
            },
            create: category,
        });
    }

    console.log('Seeded categories');
}

async function seedSubscriptionPlans() {
    for (const plan of referenceSubscriptionPlans) {
        await prisma.subscriptionPlan.upsert({
            where: { code: plan.code },
            update: {
                name: plan.name,
                description: plan.description,
                priceAmount: plan.priceAmount,
                currency: plan.currency,
                intervalMonths: plan.intervalMonths,
                isActive: plan.isActive,
            },
            create: {
                code: plan.code,
                name: plan.name,
                description: plan.description,
                priceAmount: plan.priceAmount,
                currency: plan.currency,
                intervalMonths: plan.intervalMonths,
                isActive: plan.isActive,
            },
        });
    }

    console.log('Seeded subscription plans');
}

async function seedAdminUser() {
    const email = 'admin@joymap.local';
    const plainPassword = 'Admin12345!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            role: UserRole.ADMIN,
            authProvider: AuthProvider.LOCAL,
            fullName: 'System Admin',
            isActive: true,
        },
        create: {
            email,
            passwordHash,
            role: UserRole.ADMIN,
            authProvider: AuthProvider.LOCAL,
            fullName: 'System Admin',
            isActive: true,
        },
    });

    console.log('Seeded admin user');
    console.log(`Admin login: ${email} / ${plainPassword}`);
}

async function main() {
    await seedCities();
    await seedCategories();
    await seedSubscriptionPlans();

    if (process.env.NODE_ENV !== 'production') {
        await seedAdminUser();
    }

    console.log('Seeding completed successfully');
}

main()
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
