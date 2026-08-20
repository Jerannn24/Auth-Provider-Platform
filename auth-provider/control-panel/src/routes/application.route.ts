import { Router, Request, Response } from 'express';

import * as applicationRepository from '../repositories/applications.repository';
import * as userRepository from '../repositories/users.repository'
import { createAuditLogs } from '../../../server/src/repositories/utility.repository';
import { prisma, Result } from '../../../db';

const router = Router();

router.route("/applications")
    .get(async (req: Request, res: Response) => {
        try {
            const applications = await applicationRepository.getAllApplications();
            res.json(applications);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }).post(async (req: Request, res: Response) => {
        try {
            const { name, client_id, redirect_uris, launch_url, logout_notification_url } = req.body;
            const application = await applicationRepository.createApplication(name, client_id, redirect_uris, launch_url, logout_notification_url);

            if (!application) {
                await createAuditLogs(
                    "CREATE_APPLICATION_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "APPLICATION_CREATION_FAILED",
                            "message": "Gagal membuat aplikasi"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Gagal membuat aplikasi' });
            }

            await createAuditLogs(
                "CREATE_APPLICATION_SUCCESS",
                Result.SUCCESS,
                undefined,
                application.id,
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "APPLICATION_CREATION_SUCCESS",
                        "message": "Aplikasi berhasil dibuat"
                    }
                } as any
            );

            res.status(201).json(application);
        } catch (error) {
            res.status(400).json({ error: 'Gagal membuat aplikasi' });
        }
    });

router.route("/applications/:id/groups")
    .post(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { groupId, effect } = req.body;
            
            const result = await applicationRepository.addGroupsToApplication(String(id), groupId, effect);

            if (!result) {
                await createAuditLogs(
                    "ADD_GROUP_TO_APPLICATION_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "ADD_GROUP_TO_APPLICATION_FAILED",
                            "message": "Gagal menambahkan group ke aplikasi"
                        }
                    } as any
                );

                return res.status(400).json({ error: 'Gagal menambahkan group ke aplikasi' });
            }
            
            await createAuditLogs(
                "ADD_GROUP_TO_APPLICATION_SUCCESS",
                Result.SUCCESS,
                undefined,
                undefined,
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "ADD_GROUP_TO_APPLICATION_SUCCESS",
                        "message": "Group berhasil ditambahkan ke aplikasi"
                    }
                } as any
            );

            res.status(201).json({ message: 'Group berhasil ditambahkan ke aplikasi' });
        } catch (error) {
            res.status(400).json({ error: 'Gagal menambahkan group ke aplikasi' });
        }
    }).delete(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { groupId } = req.body;

            const result = await applicationRepository.deleteGroupsFromApplication(String(id), groupId);

            prisma.$transaction(async (tx) => {
                const effectedUser = await userRepository.getUserIdsToRevoke(String(id));
                for(const user of effectedUser){
                    const eventId = crypto.randomUUID();

                    await tx.events.create({
                        data: {
                            id: eventId,
                            event_type: 'AccessPolicyChanged',
                            user_id: user,
                            central_session_id: null,
                            application_id: String(id),
                            payload: {
                                event_id: eventId,
                                event_type: 'AccessPolicyChanged',
                                user_id: user,
                                sso_session_id: null,
                                application_id: String(id),
                                reason: 'change_policy',
                                occured_at: new Date().toISOString(),
                                metadata: {}
                            },
                            status: 'PENDING'
                        }
                    });
                }
            });
            
            if (!result) {
                await createAuditLogs(
                    "DELETE_GROUP_FROM_APPLICATION_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "DELETE_GROUP_FROM_APPLICATION_FAILED",
                            "message": "Gagal menghapus group dari aplikasi"
                        }
                    } as any
                );


                return res.status(400).json({ error: 'Gagal menghapus group dari aplikasi' });
            }
    
            await createAuditLogs(
                "DELETE_GROUP_FROM_APPLICATION_SUCCESS",
                Result.SUCCESS,
                undefined,
                undefined,
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "DELETE_GROUP_FROM_APPLICATION_SUCCESS",
                        "message": "Group berhasil dihapus dari aplikasi"
                    }
                } as any
            );

            await createAuditLogs(
                "DELETE_GROUP_FROM_APPLICATION_SUCCESS",
                Result.SUCCESS,
                undefined,
                undefined,
                undefined,
                undefined,
                {
                    "MESSAGE": {
                        "code": "DELETE_GROUP_FROM_APPLICATION_SUCCESS",
                        "message": "Group berhasil dihapus dari aplikasi"
                    }
                } as any
            );
            
            res.status(200).json({ message: 'Group berhasil dihapus dari aplikasi' });
        } catch (error) {
            res.status(400).json({ error: 'Gagal menghapus group dari aplikasi' });
        }
    }).put(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { groupId, effect } = req.body;

            const result = await applicationRepository.updateGroupsInApplication(String(id), groupId, effect);

            if (!result) {
                return res.status(400).json({ error: 'Gagal memperbarui effect group dalam aplikasi' });
            }
            const effectedUser = await userRepository.getUserIdsToRevoke(String(id));
            
            for(const user of effectedUser){
                await prisma.$transaction(async (tx) => {
                const eventId = crypto.randomUUID();
                await tx.events.create({
                    data: {
                        id: eventId,
                        event_type: 'AccessPolicyChanged',
                        user_id: user,
                        central_session_id: null,
                        application_id: String(id), 
                        payload: {
                            event_id: eventId,
                            event_type: 'AccessPolicyChanged',
                            user_id: user,
                            sso_session_id: null,
                            application_id: String(id),
                            reason: 'change_policy',
                            occured_at: new Date().toISOString(),
                            metadata: {}
                        },
                        status: 'PENDING'
                    }
                });
            });


            }
            res.status(200).json({ message: 'Effect group berhasil diperbarui dalam aplikasi' });
        } catch (error) {
            res.status(400).json({ error: 'Gagal memperbarui effect group dalam aplikasi' });
        }
    });

router.route("/applications/:id/policies")
    .get(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const policies = await applicationRepository.getPoliciesByApplicationId(String(id));

            res.json(policies);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

export default router;