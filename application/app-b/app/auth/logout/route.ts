import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/dist/server/request/cookies";
import * as localSessionRepository from "../../../repositories/local.session.repository";

export async function POST() {
    const cookiesStore = await cookies();
    const sessionToken = cookiesStore.get("session_token")?.value;

    if (!sessionToken) {
        return NextResponse.redirect("http://localhost:3002/login");
    }

    const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const session = await localSessionRepository.getLocalSession(sessionTokenHash);

    if (!session) {
        return NextResponse.redirect("http://localhost:3002/login");
    }

    await localSessionRepository.revokedLocalSession(sessionTokenHash, "User logged out");

    return NextResponse.redirect("http://localhost:3002/login");
}