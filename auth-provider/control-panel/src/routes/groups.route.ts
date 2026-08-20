import { Router, Request, Response } from 'express';

import * as groupRepository from '../repositories/groups.repository';
import { createAuditLogs } from '../../../server/src/repositories/utility.repository';
import { Result, prisma } from '../../../db';

const router = Router();

router.route("/groups")
    .get(async (req: Request, res: Response) => {
        try {
            const groups = await groupRepository.getAllGroups();
            res.json(groups);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }).post(async (req: Request, res: Response) => {
        try {
            const { name, description } = req.body;
            const group = await groupRepository.createGroup(name, description);
            
            if (!group) {

                await createAuditLogs(
                    "CREATE_GROUP_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "GROUP_CREATION_FAILED",
                            "message": "Gagal membuat group"
                        }
                    } as any
                );

                return res.status(400).json({ error: 'Gagal membuat group' });
            }

            await createAuditLogs(
                "CREATE_GROUP_SUCCESS",
                Result.SUCCESS,
                undefined,
                group.id,
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "GROUP_CREATION_SUCCESS",
                        "message": "Group berhasil dibuat"
                    }
                } as any
            );

            res.status(201).json(group);
        } catch (error) {
            res.status(400).json({ error: 'Gagal membuat group' });
        }
    });

router.route("/groups/:id")
    .get(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const group = await groupRepository.getGroupById(String(id));

            if (!group) {

                await createAuditLogs(
                    "GET_GROUP_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "GROUP_NOT_FOUND",
                            "message": "Group tidak ditemukan"
                        }
                    } as any
                );

                return res.status(404).json({ error: 'Group tidak ditemukan' });
            }
            
            await createAuditLogs(
                "GET_GROUP_SUCCESS",
                Result.SUCCESS,
                undefined,
                group.id,
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "GROUP_RETRIEVAL_SUCCESS",
                        "message": "Group berhasil diambil"
                    }
                } as any
            );

            res.json(group);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }).put(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const updatedGroup = await groupRepository.updateGroupById(String(id), name, description);

            if (!updatedGroup) {
                await createAuditLogs(
                    "UPDATE_GROUP_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "GROUP_NOT_FOUND",
                            "message": "Group tidak ditemukan"
                        }
                    } as any
                );

                return res.status(404).json({ error: 'Group tidak ditemukan' });
            }

            await createAuditLogs(
                "UPDATE_GROUP_SUCCESS",
                Result.SUCCESS,
                undefined,
                updatedGroup.id,
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "GROUP_UPDATE_SUCCESS",
                        "message": "Group berhasil diperbarui"
                    }
                } as any
            );

            res.json(updatedGroup);
        } catch (error) {
            res.status(400).json({ error: 'Gagal memperbarui group' });
        }
    }).delete(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            await prisma.$transaction(async (tx) => {
                tx.user_groups.deleteMany({
                    where: { group_id: String(id) }
                });

                tx.application_group_policies.deleteMany({
                    where: { group_id: String(id) }
                });
            });
            const deletedGroup = await groupRepository.deleteGroupById(String(id));

            if (!deletedGroup) {
                await createAuditLogs(
                    "DELETE_GROUP_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "GROUP_NOT_FOUND",
                            "message": "Group tidak ditemukan"
                        }
                    } as any
                );

                return res.status(404).json({ error: 'Group tidak ditemukan' });
            }

            await createAuditLogs(
                "DELETE_GROUP_SUCCESS",
                Result.SUCCESS,
                undefined,
                deletedGroup.id,
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "GROUP_DELETE_SUCCESS",
                        "message": "Group berhasil dihapus"
                    }
                } as any
            );
            
            res.json(deletedGroup);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

router.route("/groups/:id/users")
    .get(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const users = await groupRepository.getUsersByGroupId(String(id));
        
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }).post(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            const addUserToGroup = await groupRepository.addUserToGroup(String(id), userId);

            await createAuditLogs(
                "ADD_USERS_TO_GROUP_SUCCESS",
                Result.SUCCESS,
                undefined,
                String(id),
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "ADD_USERS_TO_GROUP_SUCCESS",
                        "message": "User berhasil ditambahkan ke group"
                    }
                } as any
            );

            res.status(201).json(addUserToGroup);
        } catch (error) {
            res.status(400).json({ error: 'Gagal menambahkan user ke group' });
        }
    }).delete(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            const removeUserFromGroup = await groupRepository.removeUserFromGroup(String(id), userId);

            await createAuditLogs(
                "REMOVE_USERS_FROM_GROUP_SUCCESS",
                Result.SUCCESS,
                undefined,
                String(id),
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "REMOVE_USERS_FROM_GROUP_SUCCESS",
                        "message": "User berhasil dihapus dari group"
                    }
                } as any
            );

            res.json(removeUserFromGroup);
        } catch (error) {
            res.status(400).json({ error: 'Gagal menghapus user dari group' });
        }
    });

export default router;