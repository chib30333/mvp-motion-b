import { PrismaClient, AuthProvider, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedCities() {
    const cities = [
        { name: 'Moscow', slug: 'moscow', countryCode: 'RU', isActive: true },
        { name: 'Saint Petersburg', slug: 'saint-petersburg', countryCode: 'RU', isActive: true },
        { name: 'Kazan', slug: 'kazan', countryCode: 'RU', isActive: true },
    ];

    for (const city of cities) {
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
    const categories = [
        { name: 'Yoga', slug: 'yoga', description: 'Yoga and mindful movement', isActive: true },
        { name: 'Dance', slug: 'dance', description: 'Dance and joyful movement classes', isActive: true },
        { name: 'SPA', slug: 'spa', description: 'Relaxation and recovery services', isActive: true },
        { name: 'Workshops', slug: 'workshops', description: 'Emotional wellness workshops', isActive: true },
        { name: 'Meditation', slug: 'meditation', description: 'Meditation and stillness practices', isActive: true },
        { name: 'Breathwork', slug: 'breathwork', description: 'Breath-based wellness sessions', isActive: true },
        { name: 'Stretching', slug: 'stretching', description: 'Stretching and mobility sessions', isActive: true },
        { name: 'Massage', slug: 'massage', description: 'Massage and body recovery services', isActive: true },
        { name: 'Sound Healing', slug: 'sound-healing', description: 'Sound healing and restorative sessions', isActive: true },
        { name: 'Mindfulness', slug: 'mindfulness', description: 'Mindfulness and awareness practices', isActive: true },
    ];

    for (const category of categories) {
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
    await prisma.subscriptionPlan.upsert({
        where: { code: 'joy-map-monthly' },
        update: {
            name: 'Joy Map Monthly',
            description: 'Monthly subscription for AI Joy Map access',
            priceAmount: 49900,
            currency: 'RUB',
            intervalMonths: 1,
            isActive: true,
        },
        create: {
            code: 'joy-map-monthly',
            name: 'Joy Map Monthly',
            description: 'Monthly subscription for AI Joy Map access',
            priceAmount: 49900,
            currency: 'RUB',
            intervalMonths: 1,
            isActive: true,
        },
    });

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