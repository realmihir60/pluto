import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    // Telemetry: Track query latency
    if (typeof window === 'undefined') {
        client.$use(async (params, next) => {
            const before = Date.now();
            const result = await next(params);
            const after = Date.now();
            // In a real app, we'd pipe this to a metrics service
            // For now, we attach it to the process for the Health module to read
            (global as any).lastPrismaLatency = after - before;
            return result;
        });
    }

    return client;
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
