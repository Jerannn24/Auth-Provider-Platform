import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Effect, Status} from "../generated/prisma/client";
import * as bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const admin = await prisma.users.upsert({
        where: {
            email: "admin@admin.com"
        },
        update: {},
        create: {
            name: "admin",
            password_hash: await hashPassword("admin"),
            email: "admin@admin.com",
            status: Status.ACTIVE
        }
    });

    const group = await prisma.groups.upsert({
        where: {
            name: "admin"
        },
        update: {},
        create: {
            name: "admin",
            description: "Administrator group"
        }
    });

    const userGroup = await prisma.user_groups.upsert({
        where: {
            user_id_group_id: {
                user_id: admin.id,
                group_id: group.id
            }
        },
        update: {},
        create: {
            user_id: admin.id,
            group_id: group.id
        }
    });

    const applicationA = await prisma.applications.upsert({
        where: {
            client_id: "app-a"
        },
        update: {},
        create: {
            name: "AppA",
            client_id: "app-a",
            client_secret_hash: crypto.createHash('sha256').update("app-a-secret").digest('hex'),
            status: Status.ACTIVE,
            logout_notification_url: "http://localhost:3001/logout-notify-app-a",
        }
    });

    const redirectUriA = await prisma.application_redirect_uris.findFirst({
        where: {
            application_id: applicationA.id,
            redirect_uri: "http://localhost:3001/auth/callback"
        }
    }) ?? await prisma.application_redirect_uris.create({
        data: {
            application_id: applicationA.id,
            redirect_uri: "http://localhost:3001/auth/callback"
        }
    });

    const policyA = await prisma.application_group_policies.upsert({
        where: {
            application_id_group_id_effect: {
                application_id: applicationA.id,
                group_id: group.id,
                effect: Effect.ALLOW
            }
        },
        update: {},
        create: {
            application_id: applicationA.id,
            group_id: group.id,
            effect: Effect.ALLOW
        }
    });

    const applicationB = await prisma.applications.upsert({
        where: {
            client_id: "app-b"
        },
        update: {},
        create: {
            name: "AppB",
            client_id: "app-b",
            client_secret_hash: crypto.createHash('sha256').update("app-b-secret").digest('hex'),
            status: Status.ACTIVE,
            logout_notification_url: "http://localhost:3002/logout-notify-app-b",
        }
    });

    const redirectUriB = await prisma.application_redirect_uris.findFirst({
        where: {
            application_id: applicationB.id,
            redirect_uri: "http://localhost:3002/auth/callback"
        }
    }) ?? await prisma.application_redirect_uris.create({
        data: {
            application_id: applicationB.id,
            redirect_uri: "http://localhost:3002/auth/callback"
        }
    });

    const policyB = await prisma.application_group_policies.upsert({
        where: {
            application_id_group_id_effect: {
                application_id: applicationB.id,
                group_id: group.id,
                effect: Effect.ALLOW
            }
        },
        update: {},
        create: {
            application_id: applicationB.id,
            group_id: group.id,
            effect: Effect.ALLOW
        }
    });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
}).catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
});