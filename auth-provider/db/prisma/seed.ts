import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Effect, Status} from "@prisma/client";
import * as bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

const connectionString = `${process.env.DATABASE_URL_GLOBAL}`;
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
    
    const userA = await prisma.users.upsert({
        where: {
            email: "usera@usera.com"
        },
        update: {},
        create: {
            name: "usera",
            password_hash: await hashPassword("usera"),
            email: "usera@usera.com",
            status: Status.ACTIVE
        }
    });

    const userB = await prisma.users.upsert({
        where: {
            email: "userb@userb.com"
        },
        update: {},
        create: {
            name: "userb",
            password_hash: await hashPassword("userb"),
            email: "userb@userb.com",
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

    const groupA = await prisma.groups.upsert({
        where: {
            name: "group-a"
        },
        update: {},
        create: {
            name: "group-a",
            description: "Group A"
        }
    });

    const groupB = await prisma.groups.upsert({
        where: {
            name: "group-b"
        },
        update: {},
        create: {
            name: "group-b",
            description: "Group B"
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

    const userGroupA = await prisma.user_groups.upsert({
        where: {
            user_id_group_id: {
                user_id: userA.id,
                group_id: groupA.id
            }
        },
        update: {},
        create: {
            user_id: userA.id,
            group_id: groupA.id
        }
    });

    const userGroupB = await prisma.user_groups.upsert({
        where: {
            user_id_group_id: {
                user_id: userB.id,
                group_id: groupB.id
            }
        },
        update: {},
        create: {
            user_id: userB.id,
            group_id: groupB.id
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
            logout_notification_url: "http://app-a:3001/internal/logout",
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

    const policyAdminA = await prisma.application_group_policies.upsert({
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

    const policyGroupA = await prisma.application_group_policies.upsert({
        where: {
            application_id_group_id_effect: {
                application_id: applicationA.id,
                group_id: groupA.id,
                effect: Effect.ALLOW
            }
        },
        update: {},
        create: {
            application_id: applicationA.id,
            group_id: groupA.id,
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
            logout_notification_url: "http://app-a:3002/internal/logout",
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

    const policyAdminB = await prisma.application_group_policies.upsert({
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

    const policyGroupB = await prisma.application_group_policies.upsert({
        where: {
            application_id_group_id_effect: {
                application_id: applicationB.id,
                group_id: groupB.id,
                effect: Effect.ALLOW
            }
        },
        update: {},
        create: {
            application_id: applicationB.id,
            group_id: groupB.id,
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