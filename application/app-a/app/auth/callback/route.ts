import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

import * as localSessionRepository from "../../../repositories/local.session.repository";
import * as localUserRepository from "../../../repositories/local.user.repository";

export async function GET(request: Request) {
    const cookiesStore = await cookies();
    const state_verifier = cookiesStore.get("state")?.value;
    const code_verifier = cookiesStore.get("code_verifier")?.value;

    const params = new URL(request.url).searchParams;
    const code = params.get("code");
    const state = params.get("state");

    if (!code) {
        return NextResponse.redirect('http://localhost:8080/login');
    }

    if (!state) {
        return NextResponse.redirect('http://localhost:8080/login');
    }

    if (state !== state_verifier) {
        return NextResponse.redirect('http://localhost:8080/login');
    }

    const response = await fetch("http://server:8080/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            code,
            code_verifier,
            client_secret: process.env.CLIENT_SECRET,
        }),
    });
    

    if (!response.ok) {
        return NextResponse.redirect('http://localhost:8080/login');
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
        return NextResponse.redirect('http://localhost:8080/login');
    }

    const userInfo = await userInfoResponse.json();

    const session_token = cookiesStore.get("session_token")?.value;
    const session_token_hash = crypto.createHash('sha256').update(session_token as string).digest('hex');

    await localSessionRepository.createLocalSession(session_token_hash, userInfo.sub, userInfo.session_id, userInfo.application_id);
    await localUserRepository.createLocalUser(userInfo.sub, userInfo.name, userInfo.email, userInfo.groups);

    cookiesStore.delete("code_verifier");
    cookiesStore.delete("state");

    const redirectUrl = new URL("http://localhost:3001/dashboard");

    return NextResponse.redirect(redirectUrl);
}