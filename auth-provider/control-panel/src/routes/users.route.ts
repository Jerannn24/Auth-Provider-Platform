import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';

import * as userRepository from '../repositories/users.repository';
import { createAuditLogs } from '../../../server/src/repositories/utility.repository';
import * as sessionRepositories from '../../../server/src/repositories/session.repository';

import { Result } from '../../../db';
const router = Router();

router.route("/users")
  .post(async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userRepository.createUser(name, email, passwordHash);

    if (!user) {
      await createAuditLogs(
        "CREATE_USER_FAILED",
        Result.FAILURE,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          "ERROR": {
            "code": "USER_CREATION_FAILED",
            "message": "Gagal membuat user"
          }
        } as any
      );
      return res.status(400).json({ error: 'Gagal membuat user' });
    }

    await createAuditLogs(
      "CREATE_USER_SUCCESS",
      Result.SUCCESS,
      undefined,
      user.id,
      undefined,
      undefined,
      {
        "MESSAGE": {
          "code": "USER_CREATION_SUCCESS",
          "message": "User berhasil dibuat"
        }
      } as any
    );

    res.status(201).json(user);
  } catch (error) {
    await createAuditLogs(
      "CREATE_USER_FAILED",
      Result.FAILURE,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        "ERROR": {
          "code": "USER_CREATION_FAILED",
          "message": "Gagal membuat user atau email sudah terdaftar"
        }
      } as any
    );
    res.status(400).json({ error: 'Gagal membuat user atau email sudah terdaftar' });
  }
}).get(async (req: Request, res: Response) => {
  try {
    const users = await userRepository.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.route("/users/:id")
  .get(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userRepository.getUserById(String(id));

      if (!user) {
        await createAuditLogs(
          "GET_USER_FAILED",
          Result.FAILURE,
          undefined,
          String(id),
          undefined,
          undefined,
          {
            "ERROR": {
              "code": "USER_NOT_FOUND",
              "message": "User tidak ditemukan"
            }
          } as any
        );

        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      await createAuditLogs(
        "GET_USER_SUCCESS",
        Result.SUCCESS,
        undefined,
        String(id),
        undefined,
        undefined,
        {
          "MESSAGE": {
            "code": "USER_RETRIEVED_SUCCESS",
            "message": "User berhasil diambil"  
        }
      } as any
      );

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }).put(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const updatedUser = await userRepository.updateUserById(String(id), name, email);

      if (!updatedUser) {

        await createAuditLogs(
          "UPDATE_USER_FAILED",
          Result.FAILURE,
          undefined,
          String(id),
          undefined,
          undefined,
          {
            "ERROR": {
              "code": "USER_NOT_FOUND",
              "message": "User tidak ditemukan"
            }
          } as any
        );

        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      await createAuditLogs(
        "UPDATE_USER_SUCCESS",
        Result.SUCCESS,
        undefined,
        String(id),
        undefined,
        undefined,
        {
          "MESSAGE": {
            "code": "USER_UPDATED_SUCCESS",
            "message": "User berhasil diperbarui"
          }
        } as any
      );
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }).delete(async (req: Request, res: Response) => {
    try {
      const { id } = req.params; 
      const deletedUser = await userRepository.deleteUserById(String(id));

      if (!deletedUser) {
        await createAuditLogs(
          "DELETE_USER_FAILED",
          Result.FAILURE,
          undefined,
          String(id),
          undefined,
          undefined,
          {
            "ERROR": {
              "code": "USER_NOT_FOUND",
              "message": "User tidak ditemukan"
            }
          } as any
        );

        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      await createAuditLogs(
        "DELETE_USER_SUCCESS",
        Result.SUCCESS,
        undefined,
        String(id),
        undefined,
        undefined,
        {
          "MESSAGE": {
            "code": "USER_DELETED_SUCCESS",
            "message": "User berhasil dihapus"
          }
        } as any
      );

      res.json(deletedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

router.route("/users/:id/status")
  .get(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const status = await userRepository.getUserStatusById(String(id));

      if (status === undefined) {

        await createAuditLogs(
          "GET_USER_STATUS_FAILED",
          Result.FAILURE,
          undefined,
          String(id),
          undefined,
          undefined,
          {
            "ERROR": {
              "code": "USER_NOT_FOUND",
              "message": "User tidak ditemukan"
            }
          } as any
        );

        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      await createAuditLogs(
        "GET_USER_STATUS_SUCCESS",
        Result.SUCCESS,
        undefined,
        String(id),
        undefined,
        undefined,
        {
          "MESSAGE": {
            "code": "USER_STATUS_RETRIEVED_SUCCESS",
            "message": "Status user berhasil diambil"
          }
        } as any
      );

      res.json({ status });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }).put(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const updatedUser = await userRepository.updateUserStatusById(String(id), isActive);
  
      if (!updatedUser) {
        await createAuditLogs(
          "UPDATE_USER_STATUS_FAILED",
          Result.FAILURE,
          undefined,
          String(id),
          undefined,
          undefined,
          {
            "ERROR": {
              "code": "USER_NOT_FOUND",
              "message": "User tidak ditemukan"
            }
          } as any
        );

        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      await createAuditLogs(
        "UPDATE_USER_STATUS_SUCCESS",
        Result.SUCCESS,
        undefined,
        String(id),
        undefined,
        undefined,
        {
          "MESSAGE": {
            "code": "USER_STATUS_UPDATED_SUCCESS",
            "message": "Status user berhasil diperbarui"
          }
        } as any
      );

      if (!isActive) {
        await sessionRepositories.revokeAllSessionsByUserId(String(id));
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

export default router;


