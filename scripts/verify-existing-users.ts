import prisma from '@/lib/prisma';

/**
 * Migration Script: Auto-verify existing users
 * 
 * This script sets emailVerified to the current date for all users who don't have it set.
 * Run this ONCE after deploying the email verification system to grandfather existing users.
 * 
 * Usage: npx tsx scripts/verify-existing-users.ts
 */

async function verifyExistingUsers() {
    console.log('🔍 Checking for unverified users...');

    const unverifiedUsers = await prisma.user.findMany({
        where: { emailVerified: null },
        select: { id: true, email: true, createdAt: true },
    });

    console.log(`📊 Found ${unverifiedUsers.length} unverified users`);

    if (unverifiedUsers.length === 0) {
        console.log('✅ All users are already verified!');
        return;
    }

    console.log('\n📝 Users to be auto-verified:');
    unverifiedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (created: ${user.createdAt.toLocaleDateString()})`);
    });

    // Auto-verify all existing users
    const result = await prisma.user.updateMany({
        where: { emailVerified: null },
        data: { emailVerified: new Date() },
    });

    console.log(`\n✅ Successfully verified ${result.count} existing users`);
    console.log('🎉 Migration complete!');
}

verifyExistingUsers()
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
