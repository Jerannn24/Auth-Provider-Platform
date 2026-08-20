import { NextResponse } from "next/server";
import * as localSessionRepository from "../../../repositories/local.session.repository";
import * as localEventRepostiory from "../../../repositories/local.event.repository"
import { PcCase } from "lucide-react";

interface LogoutRequestBody {
    event_id: string;
    event_type: string;
    user_id: string;
    sso_session_id: string;
    application_id: string;
    reason: string;
    occured_at: Date;
    metadata: any;
}

export async function POST(request: Request) {
    try {
        const req = (await request.json()) as LogoutRequestBody;

        if (!req.sso_session_id && !req.user_id) {
            return NextResponse.json(
                { error: "Identifier wajib (sso_session_id atau user_id) tidak ditemukan" },
                { status: 400 }
            );
        }

        if(req.event_type === "SessionRevoked"){
            await localSessionRepository.revokedAllSessionBySSOSessionId(req.sso_session_id, req.reason);
        }else if(req.event_type === "PasswordChange"){  //req.event_type === "PasswordChange"
            await localSessionRepository.revokeAllSessionsByUserId(req.user_id, req.reason)
        }else if(req.event_type === "AccessPolicyChanged"){
            await localSessionRepository.revokeAllSessionsByUserId(req.user_id, req.reason)
        }else{
            return NextResponse.json(
                { error: "Event type tidak valid" },
                { status: 400 }
            );
        }

        localEventRepostiory.createLocalEvent(req);

        return NextResponse.json(
            {
                success: true,
                message: "Sesi lokal berhasil dicabut",
                event_id: req.event_id,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[Back-Channel Logout Error]:", error);
        return NextResponse.json(
            { error: "Gagal memproses event logout", details: error.message },
            { status: 500 }
        );
    }
}