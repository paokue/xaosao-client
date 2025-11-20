import { PrismaClient } from "@prisma/client";

declare global {
  var __db: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  prisma.$connect();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    global.__db.$connect();
  }
  prisma = global.__db;
}

export { prisma };
