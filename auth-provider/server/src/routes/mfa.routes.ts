import { Request, Response, Router } from "express";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma, Result} from "../../../db"
import crypto from "crypto";

import jwt, { JwtPayload} from "jsonwebtoken";
import * as utilityRepository from "../repositories/utility.repository";
import * as authRepository from "../repositories/auth.repository";
import { createCentralSessionAndRespond } from "../services/session.service";

const router = Router();

router.post("/mfa/setup", async (req: Request, res: Response) => {
    try {
        const sessionToken = req.cookies.session_token;
        if (!sessionToken) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sessionTokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
        const session = await prisma.sso_sessions.findFirst({
            where: { session_token_hash: sessionTokenHash, 
                status: "ACTIVE"
            },
        });

        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await authRepository.findUserById(session.user_id);

        if (!user) {
            await utilityRepository.createAuditLogs(
                'MFA_SETUP_FAILED', 
                Result.FAILURE, 
                undefined, 
                session.user_id, 
                undefined, 
                session.id,
                {
                    "ERROR": {
                        "code": "USER_NOT_FOUND",
                        "message": "User not found"
                    }
                } as any
            );

            return res.status(404).json({ error: "User not found" });
        }

        const secret = new OTPAuth.Secret({size: 20});
        const base32Secret = secret.base32;

        const totp = new OTPAuth.TOTP({
            issuer: "AuthProvider",
            label: user.email,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: secret,
        });

        const qrCodeDataURL = await QRCode.toDataURL(totp.toString());

        await prisma.users.update({
            where: { id: user.id },
            data: { mfa_secret: base32Secret },
        });

        await utilityRepository.createAuditLogs(
            'MFA_ENROLLED', 
            Result.SUCCESS,
            undefined,
            user.id, 
            undefined,
            session.id,
            {
                "mfa_enabled": true
            } as any
        );

        return res.status(200).json({ qr_code: qrCodeDataURL, secret_key: base32Secret });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
});

router.post("/mfa/verify", async (req: Request, res: Response) => {
    try {
        const sessionToken = req.cookies.session_token;
        const { code } = req.body;
        if (!sessionToken) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sessionTokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
        const session = await prisma.sso_sessions.findFirst({
            where: { session_token_hash: sessionTokenHash, 
                status: "ACTIVE"
            },
        });

        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await authRepository.findUserById(session.user_id);

        if (!user || !user.mfa_secret) {
            await utilityRepository.createAuditLogs(
                'MFA_VERIFICATION_FAILED',
                Result.FAILURE,
                undefined,
                session.user_id,
                undefined,
                session.id,
                {
                    "ERROR": {
                        "code": "MFA_NOT_ENABLED",
                        "message": "MFA is not enabled for this user"
                    }
                } as any
            );

            return res.status(400).json({ error: "MFA is not enabled for this user" });
        }

        const totp = new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(user.mfa_secret),
        });

        const isValid = totp.validate({ token: code, window: 1 }) !== null;

        if (!isValid) {
            await utilityRepository.createAuditLogs(
                'MFA_VERIFICATION_FAILED',
                Result.FAILURE,
                undefined,
                user.id,
                undefined,
                session.id,
                {
                    "ERROR": {
                        "code": "INVALID_MFA_CODE",
                        "message": "Invalid MFA code"
                    }
                } as any
            );

            return res.status(400).json({ error: "Invalid MFA code" });
        }

        await utilityRepository.createAuditLogs(
            'MFA_VERIFIED',
            Result.SUCCESS,
            undefined,
            user.id,
            undefined,
            session.id,
            {
                "mfa_enabled": true
            } as any
        );

        await prisma.users.update({
            where: { id: user.id },
            data: { mfa_enabled: true },
        });

        return res.status(200).json({ message: "MFA verified successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
});

router.post("/login/mfa", async (req, res) => {
    try {
        const { mfa_pending_token, code } = req.body;

        let payload: any;

        try {
            payload = jwt.verify(mfa_pending_token, process.env.JWT_SECRET!) as JwtPayload;
            if (payload.purpose !== "mfa_pending") {
                throw new Error("Invalid token purpose");
            }
        }catch (error) {
            await utilityRepository.createAuditLogs(
                'LOGIN_MFA_FAILED',
                Result.FAILURE,
                undefined,
                undefined,
                undefined,
                undefined,
                {
                    "ERROR": {
                        "code": "INVALID_MFA_PENDING_TOKEN",
                        "message": "Token MFA pending tidak valid"
                    }
                } as any
            );
            return res.status(401).json({ error: 'Token MFA pending tidak valid' });
        }

        const user = await authRepository.findUserById(payload.sub);
        
        if (!user || !user.mfa_enabled || !user.mfa_secret) {
            await utilityRepository.createAuditLogs(
                'LOGIN_MFA_FAILED',
                Result.FAILURE,
                undefined,
                user?.id,
                undefined,
                undefined,
                {
                    "ERROR": {
                        "code": "MFA_NOT_ENABLED",
                        "message": "MFA tidak diaktifkan untuk user ini"
                    }
                } as any
            );
            return res.status(401).json({ error: 'MFA tidak diaktifkan untuk user ini' });
        }

        const totp = new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(user.mfa_secret),
        });

        const isCodeValid = totp.validate({ token: code, window: 1 }) !== null;
        if (!isCodeValid) {
            await utilityRepository.createAuditLogs(
                'LOGIN_MFA_FAILED',
                Result.FAILURE,
                undefined,
                user.id,
                undefined,
                undefined,
                {
                    "ERROR": {
                        "code": "INVALID_MFA_CODE",
                        "message": "Kode MFA tidak valid"
                    }
                } as any
            );
            return res.status(401).json({ error: 'Kode MFA tidak valid' });
        }

        return createCentralSessionAndRespond(user.id, req, res);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
});

export default router;
