import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import * as userController from '../controller/users.controller';

const router = Router();


router.route("/users")
  .post(async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userController.createUser(name, email, passwordHash);

    if (!user) {
      return res.status(400).json({ error: 'Gagal membuat user' });
    }
    
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Gagal membuat user atau email sudah terdaftar' });
  }
}).get(async (req: Request, res: Response) => {
  try {
    const users = await userController.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.route("/users/:id")
  .get(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userController.getUserById(String(id));

      if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }).put(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const updatedUser = await userController.updateUserById(String(id), name, email);

      if (!updatedUser) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }).delete(async (req: Request, res: Response) => {
    try {
      const { id } = req.params; 
      const deletedUser = await userController.deleteUserById(String(id));

      if (!deletedUser) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      res.json(deletedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

router.route("/users/:id/status")
  .put(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const updatedUser = await userController.updateUserStatusById(String(id), isActive);

      if (!updatedUser) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

export default router;


