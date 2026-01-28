import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing DB connection...')
    try {
        const userCount = await prisma.user.count()
        console.log('Connection successful! User count:', userCount)
    } catch (e) {
        console.error('Connection failed!')
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
