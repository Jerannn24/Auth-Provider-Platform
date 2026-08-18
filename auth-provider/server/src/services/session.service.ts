import { Request, Response } from "express";
import crypto from "crypto";
import { Result } from "@prisma/client";
import * as sessionRepository  from "../repositories/session.repository";
import { createAuditLogs } from "../repositories/utility.repository";

export async function createCentralSessionAndRespond(
    userId: string,
    req: Request,
    res: Response
) {
    // 1. Generate Token & Hash SHA-256
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = crypto
        .createHash("sha256")
        .update(sessionToken)
        .digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip;

    const session = await sessionRepository.createSession(
        userId,
        sessionTokenHash,
        expiresAt,
        ipAddress,
    );

    res.cookie("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
    });

    await createAuditLogs(
        "LOGIN_SUCCESS",
        Result.SUCCESS,
        userId,
        userId,
        undefined,
        session.id,
        {
            ip: ipAddress
        } as any
    );

    return res.status(200).json({
        success: true,
        message: "Login berhasil",
        sessionId: session.id,
    });
}