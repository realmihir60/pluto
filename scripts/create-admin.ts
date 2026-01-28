import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Create Admin User
 * Run with: npx tsx scripts/create-admin.ts
 */

async function createAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pluto.com';
    const adminPassword = 'Admin@123'; // Change this!

    console.log(`\n🔐 Creating admin user: ${adminEmail}\n`);

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (existing) {
        // Update existing user to be admin
        await prisma.user.update({
            where: { email: adminEmail },
            data: {
                isAdmin: true,
                emailVerified: new Date(), // Auto-verify admin
            },
        });
        console.log(`✅ Updated existing user to admin`);
    } else {
        // Create new admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Admin',
                password: hashedPassword,
                isAdmin: true,
                emailVerified: new Date(),
                hasConsented: true,
            },
        });
        console.log(`✅ Created new admin user`);
    }

    console.log(`\n📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`\n⚠️  Change the password after first login!\n`);
}

createAdmin()
    .catch((error) => {
        console.error('❌ Failed to create admin:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
