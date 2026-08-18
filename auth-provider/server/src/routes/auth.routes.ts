import { Router, application, request, response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { SSOStatus, Result, prisma } from "../../../db";

import * as authRepository from "../repositories/auth.repository";
import * as sessionRepository from "../repositories/session.repository";
import * as clientRepository from "../repositories/client.repository";
import * as tokenRepository from "../repositories/token.repository";
import * as utilRepository from "../repositories/utility.repository";

import jwt, { JwtPayload} from "jsonwebtoken";
import { createAuditLogs, updateUserPasswordHash } from "../repositories/utility.repository";
import {createCentralSessionAndRespond} from "../services/session.service"

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

            if (user.mfa_enabled) {
                await createAuditLogs(
                    'LOGIN_MFA_REQUIRED',
                    Result.SUCCESS,
                    undefined,
                    user.id,
                    undefined,
                    undefined,
                    {
                        "MESSAGE": {
                            "code": "MFA_REQUIRED",
                            "message": "MFA diperlukan untuk login"
                        }
                    } as any
                );

                const mfaPendingToken = jwt.sign(
                    { sub: user.id, purpose: "mfa_pending" },
                    process.env.JWT_SECRET!,
                    { expiresIn: "5m" }
                );

                return res.status(200).json({ mfa_required: true, mfa_pending_token: mfaPendingToken });
            }

            return createCentralSessionAndRespond(user.id, req, res);
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
                return res.redirect(`http://localhost:5173/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&code_challenge=${code_challenge}`);
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
                return res.redirect(`http://localhost:5173/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&code_challenge=${code_challenge}`);
            }

            if (session.expires_at < new Date()) {
                return res.redirect(`http://localhost:5173/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&code_challenge=${code_challenge}`);
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
                return res.redirect(`http://localhost:5173/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&code_challenge=${code_challenge}`);
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

            const isUserHasAccess = await authRepository.isUserHasAccessToApplication(user.id, client.id);
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

            await prisma.$transaction(async (tx) => {
                await tx.sso_sessions.update({
                    where: { id: session.id },
                    data: { status: SSOStatus.REVOKED, revoked_at: new Date(), revoke_reason: 'sso_logout' }
                });

                const eventId = crypto.randomUUID();
                await tx.events.create({
                    data: {
                        id: eventId,
                        event_type: 'SessionRevoked',
                        user_id: session.user_id,
                        central_session_id: session.id,
                        application_id: null, 
                        payload: {
                            event_id: eventId,
                            event_type: 'SessionRevoked',
                            user_id: session.user_id,
                            sso_session_id: session.id,
                            application_id: null,
                            reason: 'sso_logout',
                            occured_at: new Date().toISOString(),
                            metadata: {}
                        },
                        status: 'PENDING'
                    }
                });
            });

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
            const { email, oldPassword, newPassword } = req.body;

            const user = await authRepository.findUserByEmail(email);
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
            
            await prisma.$transaction(async (tx) => {
                await tx.sso_sessions.updateMany({
                    where: { user_id: user.id },
                    data: { status: SSOStatus.REVOKED, revoked_at: new Date(), revoke_reason: 'change_account_password' }
                });

                const eventId = crypto.randomUUID();
                await tx.events.create({
                    data: {
                        id: eventId,
                        event_type: 'PasswordChanged',
                        user_id: user.id,
                        central_session_id: null,
                        application_id: null, 
                        payload: {
                            event_id: eventId,
                            event_type: 'PasswordChanged',
                            user_id: user.id,
                            sso_session_id: user.id,
                            application_id: null,
                            reason: 'change_account_password',
                            occured_at: new Date().toISOString(),
                            metadata: {}
                        },
                        status: 'PENDING'
                    }
                });
            }); 

            await createAuditLogs(
                "CHANGE_PASSWORD_SUCCESS",
                Result.SUCCESS,
                user.id,
                user.id,
                undefined,
                undefined,
                {
                    message: "Password berhasil diubah"
                } as any
            );

            return res.status(200).json({ message: 'Password berhasil diubah' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
    });

router.route("/token")
    .post(async (req, res) => {
        try {
            const { code, code_verifier, client_secret } = req.body;

            if (!code || !code_verifier || !client_secret) {
                await createAuditLogs(
                    "TOKEN_REQUEST_FAILED",
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

            const code_hash = crypto.createHash('sha256').update(code).digest('hex');
            const authorizationCode = await clientRepository.getAuthorizationCode(code_hash);

            if (!authorizationCode) {
                await createAuditLogs(`TOKEN_REQUEST_FAILED`,
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "INVALID_AUTHORIZATION_CODE",
                            "message": "Kode otorisasi tidak valid"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Kode otorisasi tidak valid' });
            }

            if (authorizationCode.expires_at < new Date()) {
                await createAuditLogs(
                    "TOKEN_REQUEST_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "AUTHORIZATION_CODE_EXPIRED",
                            "message": "Kode otorisasi telah kedaluwarsa"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Kode otorisasi telah kedaluwarsa' });
            }

            const clientSecretHash = crypto.createHash('sha256').update(client_secret).digest('hex');
            const client = await clientRepository.getClientBySecret(clientSecretHash);

            if (!client) {
                await createAuditLogs(
                    "TOKEN_REQUEST_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "CLIENT_NOT_FOUND",
                            "message": "Client tidak ditemukan"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Client tidak ditemukan' });
            }

            if (client.client_secret_hash !== clientSecretHash) {
                await createAuditLogs(
                    "TOKEN_REQUEST_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "INVALID_CLIENT_SECRET",
                            "message": "Secret client tidak valid"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Secret client tidak valid' });
            }

            const codeChallenge = crypto.createHash('sha256').update(code_verifier).digest('hex');

            if (codeChallenge !== authorizationCode.code_challenge) {
                await createAuditLogs(
                    "TOKEN_REQUEST_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "INVALID_CODE_VERIFIER",
                            "message": "Code verifier tidak valid"
                        }
                    } as any
                );
                return res.status(400).json({ error: 'Code verifier tidak valid' });
            }
            
            const token = await tokenRepository.createToken(code_hash);
            
            if (!token) {
                await createAuditLogs(
                    "TOKEN_REQUEST_FAILED",
                    Result.FAILURE,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    {
                        "ERROR": {
                            "code": "ACCESS_TOKEN_CREATION_FAILED",
                            "message": "Gagal membuat access token"
                        }
                    } as any
                );
                return res.status(500).json({ error: 'Gagal membuat access token' });
            }

            const accessToken = jwt.sign(
                {
                    user_id: token.user_id,
                    application_id: token.application_id,
                    sso_session_id: token.sso_session_id,
                    exp: Math.floor(token.expires_at.getTime() / 1000),
                },
                process.env.JWT_SECRET!,
                { 
                    algorithm: 'HS256', 
                }
            );

            await createAuditLogs(
                "TOKEN_REQUEST_SUCCESS",
                Result.SUCCESS,
                token.user_id,
                token.sso_session_id,
                client.id,
                undefined,
                {
                    "MESSAGE": {
                        "code": "ACCESS_TOKEN_CREATED",
                        "message": "Access token berhasil dibuat"
                    }
                } as any
            );

            await clientRepository.consumeAuthorizationCode(authorizationCode.id);

            return res.status(200).json(
            { 
                access_token: accessToken, 
                token_type: "Bearer", 
                expires_at: token.expires_at
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
    });

router.route("/userinfo")
    .get(async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
            
            const userInfo = await utilRepository.getUserInfo(decoded);

            return res.status(200).json({ 
                sub: userInfo?.id,
                email: userInfo?.email,
                name: userInfo?.name,
                groups: userInfo?.user_groups.map(ug => ug.group.name) ?? [],
                session_id: decoded.sso_session_id,
                application_id: decoded.application_id,
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
    });

export default router;
