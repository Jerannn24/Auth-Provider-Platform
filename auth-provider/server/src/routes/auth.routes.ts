import { Router, application, request, response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { Status, Result } from "../../../db";

import * as authRepository from "../repositories/auth.repository";
import * as sessionRepository from "../repositories/session.repository";
import * as clientRepository from "../repositories/client.repository";
import { createAuditLogs, updateUserPasswordHash } from "../repositories/utility.repository";

const router = Router();

router.route("/login")
    .post(async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await authRepository.findUserByEmail(email);

            if (!user) {
                await createAuditLogs('LOGIN_FAILED',  Result.FAILURE, undefined, undefined, undefined, undefined, undefined);
                return res.status(401).json({ error: 'User tidak ditemukan' });
            }

            const isPasswordValid = await authRepository.verifyPassword(password, user.password_hash);

            if (!isPasswordValid) {
                await createAuditLogs(
                    'LOGIN_FAILED', 
                    Result.FAILURE, 
                    undefined, 
                    user.id, 
                    undefined, 
                    undefined, 
                    {
                        "ERROR": {
                            "code": "INVALID_PASSWORD",
                            "message": "Password yang dimasukkan salah"
                        }
                    } as any
                );
                return res.status(401).json({ error: 'Password salah' });
            }

            const isActive = await authRepository.isActiveUser(user.id);

            if (!isActive) {
                await createAuditLogs(
                    'LOGIN_FAILED', 
                    Result.FAILURE, 
                    undefined, 
                    user.id, 
                    undefined, 
                    undefined, 
                    {
                        "ERROR": {
                            "code": "INACTIVE_USER",
                            "message": "User tidak aktif"
                        }   
                    } as any
                );
                return res.status(403).json({ error: 'User tidak aktif' });
            }

            const sessionToken = crypto.randomBytes(32).toString('hex');
            const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

            const session = await sessionRepository.createSession(user.id, sessionTokenHash, expiresAt);

            res.cookie('session_token', sessionToken, {
                httpOnly: true,
                sameSite: 'strict',
                expires: expiresAt,
            });

            await createAuditLogs(
                "LOGIN_SUCCESS",
                Result.SUCCESS,
                user.id,
                user.id,
                undefined,
                session.id,
                {
                    email: user.email
                } as any
            );

            return res.status(200).json({ message: 'Login berhasil' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
    });

router.route("/authorize")
    .get(async (req, res) => {
        try {
            const sessionToken = req.cookies.session_token;
            const { client_id, redirect_uri, state, code_challenge } = req.query;

            if (!client_id || !redirect_uri || !state || !code_challenge) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "MISSING_PARAMETERS",
                            "message": "Parameter yang dibutuhkan tidak lengkap"
                        }
                    } as any
                );
             
                return res.status(400).json({ error: 'Parameter yang dibutuhkan tidak lengkap' });
            }

            if (!sessionToken) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    String(client_id),
                    {
                        "ERROR": {
                            "code": "NO_SESSION_TOKEN",
                            "message": "Token sesi tidak ditemukan"
                        }
                    } as any
                );
                return res.redirect('/login');
            }

            const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
            const session = await sessionRepository.getSessionByToken(sessionTokenHash);

            if (!session) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    String(client_id),
                    {
                        "ERROR": {
                            "code": "NO_SESSION",
                            "message": "Sesi tidak ditemukan"
                        }
                    } as any
                );
                return res.redirect('/login');
            }

            if (session.expires_at < new Date()) {
                return res.redirect('/login');
            }

            const client = await clientRepository.validateClientID(String(client_id));
            if (!client) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    String(client_id),
                    undefined,
                    {
                        "ERROR": {
                            "code": "INVALID_CLIENT_ID",
                            "message": "Client ID tidak valid"
                        }
                    } as any
                );

                return res.status(400).json({ error: 'Client ID tidak valid' });
            }

            if (client.status !== "ACTIVE") {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    String(client_id),
                    undefined,
                    {
                        "ERROR": {
                            "code": "INACTIVE_CLIENT",
                            "message": "Client tidak aktif"
                        }
                    } as any
                );
                return res.status(403).json({ error: 'Client tidak aktif' });
            }

            const validRedirectUri = await clientRepository.validateRedirectURI(String(client_id), String(redirect_uri));
            if (!validRedirectUri) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    String(client_id),
                    undefined,
                    {
                        "ERROR": {
                            "code": "INVALID_REDIRECT_URI",
                            "message": "Redirect URI tidak valid"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Redirect URI tidak valid' });
            }

            const user = await authRepository.findUserById(session.user_id);
            if (!user) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    String(client_id),
                    undefined,
                    {
                        "ERROR": {
                            "code": "USER_NOT_FOUND",
                            "message": "User tidak ditemukan"
                        }
                    } as any
                );
                return res.redirect('/login');
            }

            const isActive = await authRepository.isActiveUser(user.id);
            if (!isActive) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    String(client_id),
                    undefined,
                    {
                        "ERROR": {
                            "code": "INACTIVE_USER",
                            "message": "User tidak aktif"
                        }
                    } as any
                );
                return res.status(403).json({ error: 'User tidak aktif' });
            }

            const isUserHasAccess = await authRepository.isUserHasAccessToApplication(user.id, String(client_id));
            if (!isUserHasAccess) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    String(client_id),
                    undefined,
                    {
                        "ERROR": {
                            "code": "NO_ACCESS_TO_APPLICATION",
                            "message": "User tidak memiliki akses ke aplikasi"
                        }
                    } as any
                );
                return res.status(403).json({ error: 'User tidak memiliki akses ke aplikasi' });
            }

            const code = crypto.randomBytes(32).toString('hex');
            const codeHash = crypto.createHash('sha256').update(code).digest('hex');
            const authorizationCode = await clientRepository.createAuthorizationCode(user.id, client.id, String(redirect_uri), session.id, String(codeHash), String(code_challenge));

            if (!authorizationCode) {
                await createAuditLogs(
                    "AUTHORIZE_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    String(client_id),
                    session.id,
                    {
                        "ERROR": {
                            "code": "AUTHORIZATION_CODE_CREATION_FAILED",
                            "message": "Gagal membuat kode otorisasi"
                        }
                    } as any
                );
                
                return res.status(500).json({ error: 'Gagal membuat kode otorisasi' });
            }

            await createAuditLogs(
                "AUTHORIZE_CODE_GENERATED",
                Result.SUCCESS,
                user.id,
                user.id,
                String(client_id),
                session.id,
                {
                    redirect_uri: String(redirect_uri),
                    code_challenge: String(code_challenge)
                } as any
            );
            
            res.redirect(`${redirect_uri}?code=${code}&state=${state}`);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
    });

router.route("/logout")
    .post(async (req, res) => {
        try {
            const sessionToken = req.cookies.session_token;

            if (!sessionToken) {
                await createAuditLogs(
                    "LOGOUT_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "NO_SESSION_TOKEN",
                            "message": "Token sesi tidak ditemukan"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Token sesi tidak ditemukan' });
            }

            const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
            const session = await sessionRepository.getSessionByToken(sessionTokenHash);

            if (!session) {
                await createAuditLogs(
                    "LOGOUT_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "NO_SESSION",
                            "message": "Sesi tidak ditemukan"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Sesi tidak ditemukan' });
            }

            await sessionRepository.updateSessionByToken(sessionTokenHash);

            res.clearCookie('session_token');

            await createAuditLogs(
                "LOGOUT_SUCCESS",
                Result.SUCCESS,
                session.user_id,
                session.user_id,
                undefined,
                session.id,
                {
                    message: "Logout berhasil"
                } as any
            );

            return res.status(200).json({ message: 'Logout berhasil' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
    });

router.route("/change-password")
    .post(async (req, res) => {
        try {
            const sessionToken = req.cookies.session_token;
            const { oldPassword, newPassword } = req.body;

            if (!sessionToken) {
                await createAuditLogs(
                    "CHANGE_PASSWORD_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "NO_SESSION_TOKEN",
                            "message": "Token sesi tidak ditemukan"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Token sesi tidak ditemukan' });
            }

            const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
            const session = await sessionRepository.getSessionByToken(sessionTokenHash);

            if (!session) {
                await createAuditLogs(
                    "CHANGE_PASSWORD_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "NO_SESSION",
                            "message": "Sesi tidak ditemukan"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Sesi tidak ditemukan' });
            }

            const user = await authRepository.findUserById(session.user_id);
            if (!user) {
                await createAuditLogs(
                    "CHANGE_PASSWORD_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "USER_NOT_FOUND",
                            "message": "User tidak ditemukan"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'User tidak ditemukan' });
            }

            const isOldPasswordValid = await authRepository.verifyPassword(oldPassword, user.password_hash);
            if (!isOldPasswordValid) {
                await createAuditLogs(
                    "CHANGE_PASSWORD_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "INVALID_OLD_PASSWORD",
                            "message": "Password lama salah"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Password lama salah' });
            }

            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            await updateUserPasswordHash(user.id, newPasswordHash);
            await sessionRepository.revokeAllSessionsByUserId(user.id);


            await createAuditLogs(
                "CHANGE_PASSWORD_SUCCESS",
                Result.SUCCESS,
                user.id,
                user.id,
                undefined,
                session.id,
                {
                    message: "Password berhasil diubah"
                } as any
            );

            res.clearCookie("session_token");
            return res.status(200).json({ message: 'Password berhasil diubah' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
    });


export default router;



