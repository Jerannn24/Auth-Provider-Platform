import { Router, Request, Response } from 'express';

import * as appllicationController from '../controller/applications.controller';

const router = Router();

router.route("/applications")
    .get(async (req: Request, res: Response) => {
        try {
            const applications = await appllicationController.getAllApplications();
            res.json(applications);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }).post(async (req: Request, res: Response) => {
        try {
            const { name, client_id, redirect_uris, launch_url, logout_notification_url } = req.body;
            const application = await appllicationController.createApplication(name, client_id, redirect_uris, launch_url, logout_notification_url);

            if (!application) {
                return res.status(400).json({ error: 'Gagal membuat aplikasi' });
            }

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
            
            const result = await appllicationController.addGroupsToApplication(String(id), groupId, effect);

            if (!result) {
                return res.status(400).json({ error: 'Gagal menambahkan group ke aplikasi' });
            }

            res.status(201).json({ message: 'Group berhasil ditambahkan ke aplikasi' });
        } catch (error) {
            res.status(400).json({ error: 'Gagal menambahkan group ke aplikasi' });
        }
    }).delete(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { groupId } = req.body;

            const result = await appllicationController.deleteGroupsFromApplication(String(id), groupId);

            if (!result) {
                return res.status(400).json({ error: 'Gagal menghapus group dari aplikasi' });
            }

            res.status(200).json({ message: 'Group berhasil dihapus dari aplikasi' });
        } catch (error) {
            res.status(400).json({ error: 'Gagal menghapus group dari aplikasi' });
        }
    }).put(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { groupId, effect } = req.body;

            const result = await appllicationController.updateGroupsInApplication(String(id), groupId, effect);

            if (!result) {
                return res.status(400).json({ error: 'Gagal memperbarui effect group dalam aplikasi' });
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
            const policies = await appllicationController.getPoliciesByApplicationId(String(id));

            res.json(policies);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

export default router;