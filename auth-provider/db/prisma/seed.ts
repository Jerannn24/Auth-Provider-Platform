import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Effect, Status, SSOStatus, Result } from "../generated/prisma/client";
import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 20;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const admin = await prisma.users.create({
        data: {
            name: "admin",
            password_hash: await hashPassword("admin"),
            email: "admin@admin.com",
            status: Status.ACTIVE
        }
    });

    const group = await prisma.groups.create({
        data: {
            name: "admin",
            description: "Administrator group"
        }
    });

    const userGroup = await prisma.user_groups.create({
        data: {
            user_id: admin.id,
            group_id: group.id
        }
    });

    const application = await prisma.applications.create({
        data: {
            name: "AppA",
            client_id: "app-a",
            client_secret_hash: await hashPassword("app-a-secret"),
            status: Status.ACTIVE
            lo
        }
    });
}