import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import * as groupController from '../controller/groups.controller';

const router = Router();

router.route("/groups")
    .get(async (req: Request, res: Response) => {
        try {
            const groups = await groupController.getAllGroups();
            res.json(groups);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }).post(async (req: Request, res: Response) => {
        try {
            const { name, description } = req.body;
            const group = await groupController.createGroup(name, description);
            
            if (!group) {
                return res.status(400).json({ error: 'Gagal membuat group' });
            }

            res.status(201).json(group);
        } catch (error) {
            res.status(400).json({ error: 'Gagal membuat group' });
        }
    });

router.route("/groups/:id")
    .get(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const group = await groupController.getGroupById(String(id));

            if (!group) {
                return res.status(404).json({ error: 'Group tidak ditemukan' });
            }

            res.json(group);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }).put(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const updatedGroup = await groupController.updateGroupById(String(id), name, description);

            if (!updatedGroup) {
                return res.status(404).json({ error: 'Group tidak ditemukan' });
            }

            res.json(updatedGroup);
        } catch (error) {
            res.status(400).json({ error: 'Gagal memperbarui group' });
        }
    }).delete(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deletedGroup = await groupController.deleteGroupById(String(id));

            if (!deletedGroup) {
                return res.status(404).json({ error: 'Group tidak ditemukan' });
            }
            res.json(deletedGroup);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

router.route("/groups/:id/users")
    .get(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const users = await groupController.getUsersByGroupId(String(id));

            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

export default router;