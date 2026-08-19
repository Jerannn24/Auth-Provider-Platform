import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

import * as localSessionRepository from "../../../repositories/local.session.repository";
import * as localUserRepository from "../../../repositories/local.user.repository";
import * as activityLogRepository from "../../../repositories/local.log.repository";

async function createFailActivityLog(correlation_id: string, state: string, metadata: any) {
    await activityLogRepository.createActivityLog(correlation_id, state, "FAILURE", metadata);
    
    const cookiesStore = await cookies();
    cookiesStore.delete("session_token");
    cookiesStore.delete("code_verifier");
    cookiesStore.delete("state");

    return NextResponse.redirect('http://localhost:3001/');
} 

export async function GET(request: Request) {
    const cookiesStore = await cookies();
    const existCorrelationId = cookiesStore.get("correlation")?.value || crypto.randomUUID();
    const state_verifier = cookiesStore.get("state")?.value;
    const code_verifier = cookiesStore.get("code_verifier")?.value;

    const params = new URL(request.url).searchParams;
    const code = params.get("code");
    const state = params.get("state");

    if (!code) {
        return await createFailActivityLog(existCorrelationId, "CODE_MISSING", { error: "Missing authorization code" });
    }

    if (!state) {
        return await createFailActivityLog(existCorrelationId, "STATE_MISSING", { error: "Missing state parameter" });
    }

    if (state !== state_verifier) {
        return await createFailActivityLog(existCorrelationId, "STATE_MISMATCH", { error: "State parameter does not match" });
    }

    await activityLogRepository.createActivityLog(existCorrelationId, "CODE_RECEIVED", "SUCCESS", { message: "Successfully received authorization code" });

    const response = await fetch("http://server:8080/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            code,
            code_verifier,
            client_secret: process.env.CLIENT_SECRET_A,
        }),
    });
    
    await activityLogRepository.createActivityLog(existCorrelationId, "TOKEN_EXCHANGE", "SUCCESS", { message: "Successfully exchanged authorization code for access token" });

    if (!response.ok) {
        return await createFailActivityLog(existCorrelationId, "TOKEN_EXCHANGE", { error: "Failed to exchange authorization code for access token" });
    }

    const data = await response.json();

    const accessToken = data.access_token;    

    const userInfoResponse = await fetch("http://server:8080/userinfo", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (!userInfoResponse.ok) {
        return await createFailActivityLog(existCorrelationId, "USER_INFO", { error: "Failed to fetch user information" });
    }

    await activityLogRepository.createActivityLog(existCorrelationId, "USER_INFO", "SUCCESS", { message: "Successfully fetched user information" });
    const userInfo = await userInfoResponse.json();

    const session_token = cookiesStore.get("session_token")?.value;
    const session_token_hash = crypto.createHash('sha256').update(session_token as string).digest('hex');

    await localSessionRepository.createLocalSession(session_token_hash, userInfo.sub, userInfo.session_id);
    await localUserRepository.createLocalUser(userInfo.sub, userInfo.name, userInfo.email, userInfo.groups);

    cookiesStore.delete("code_verifier");
    cookiesStore.delete("state");

    const redirectUrl = new URL("http://localhost:3001/dashboard");

    return NextResponse.redirect(redirectUrl);
}