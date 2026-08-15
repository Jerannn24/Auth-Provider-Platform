import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/dist/server/request/cookies";
import * as activityLogRepository from "../../../repositories/local.log.repository";
import { getSession } from "@/repositories/local.session.repository";

export async function GET() {
    const cookiesStore = await cookies();
    const session = await getSession();

    const existCorrelationId = cookiesStore.get("correlation")?.value;
    const correlation_id = existCorrelationId || crypto.randomUUID();

    if (session) {
        return NextResponse.redirect("http://localhost:3001/dashboard");
    }
    
    const state = crypto.randomUUID();
    const code_verifier = crypto.randomUUID();

    const redirectUrl = new URL("http://localhost:8080/authorize");
    redirectUrl.searchParams.set("client_id", process.env.CLIENT_ID!);
    redirectUrl.searchParams.set("redirect_uri", "http://localhost:3001/auth/callback");
    redirectUrl.searchParams.set("state", state);
    redirectUrl.searchParams.set("code_challenge", crypto.createHash('sha256').update(code_verifier).digest('hex'));

    cookiesStore.set("code_verifier", code_verifier,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    cookiesStore.set("state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    cookiesStore.set("correlation", correlation_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    await activityLogRepository.createActivityLog(correlation_id, "LOGIN_INITIATED", "SUCCESS", { message: "Login initiated" });
    return NextResponse.redirect(redirectUrl);
}