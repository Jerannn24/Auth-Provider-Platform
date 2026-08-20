import { prisma, Status } from "../../../db";

// Mendapatkan semua user
export const getAllUsers = async () => {
    return await prisma.users.findMany({
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Membuat user baru
export const createUser = async (name: string, email: string, password_hash: string) => {
    return await prisma.users.create({
        data: { name, email, password_hash },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });;
};

// Mendapatkan user berdasarkan ID
export const getUserById = async (id: string) => {
    return await prisma.users.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Mengupdate data user berdasarkan ID
export const updateUserById = async (id: string, name: string, email: string) => {
    return await prisma.users.update({
        where: { id },
        data: { name, email },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Menghapus user berdasarkan ID
export const deleteUserById = async (id: string) => {
    return await prisma.users.delete({
        where: { id },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Mengupdate status user
export const updateUserStatusById = async (id: string, status: boolean) => {
    const active = !status ? Status.ACTIVE : Status.INACTIVE;

    return await prisma.users.update({
        where: { id },
        data: { status: active },
        select: { id: true, name: true, email: true, status: true, created_at: true }
    });
}

// Mendapatkan status user
export const getUserStatusById = async (id: string) => {
    const user = await prisma.users.findUnique({
        where: { id },
        select: { status: true }
    });

    return user?.status;
}

export async function getUsersWithoutAccess(applicationId: string) {
  // 1. Ambil semua policy terdaftar untuk aplikasi ini
  const policies = await prisma.application_group_policies.findMany({
    where: { application_id: applicationId },
  });

  const allowedGroupIds = policies
    .filter((p) => p.effect === "ALLOW")
    .map((p) => p.group_id);

  const deniedGroupIds = policies
    .filter((p) => p.effect === "DENY")
    .map((p) => p.group_id);

  // 2. Query user yang TIDAK memiliki akses
  const usersWithoutAccess = await prisma.users.findMany({
    where: {
      OR: [
        // Kondisi A: Status user Non-Aktif
        { status: "INACTIVE" },

        // Kondisi B: User masuk ke salah satu grup yang di-DENY
        {
          user_groups: {
            some: {
              group_id: { in: deniedGroupIds },
            },
          },
        },

        // Kondisi C: User TIDAK masuk ke salah satu pun grup yang di-ALLOW
        {
          user_groups: {
            none: {
              group_id: { in: allowedGroupIds },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
    },
  });

  return usersWithoutAccess;
}

export async function getUserIdsWithoutAccess(applicationId: string): Promise<string[]> {
  const policies = await prisma.application_group_policies.findMany({
    where: { application_id: applicationId },
  });

  const allowedGroupIds = policies
    .filter((p) => p.effect === "ALLOW")
    .map((p) => p.group_id);

  const deniedGroupIds = policies
    .filter((p) => p.effect === "DENY")
    .map((p) => p.group_id);

  const usersWithoutAccess = await prisma.users.findMany({
    where: {
      OR: [
        { status: Status.INACTIVE },
        { user_groups: { some: { group_id: { in: deniedGroupIds } } } },
        { user_groups: { none: { group_id: { in: allowedGroupIds } } } },
      ],
    },
    select: {
      id: true,
    },
  });

  return usersWithoutAccess.map((user) => user.id);
}

export async function getUserIdsToRevoke(applicationId: string): Promise<string[]> {
  const targetUserIds = await getUserIdsWithoutAccess(applicationId);

  if (targetUserIds.length === 0) return [];

  const activeTokens = await prisma.access_tokens.findMany({
    where: {
      application_id: applicationId,
      status: "ACTIVE",
      user_id: { in: targetUserIds },
    },
    select: {
      user_id: true,
    },
    distinct: ["user_id"],
  });

  return activeTokens.map((token) => token.user_id);
}