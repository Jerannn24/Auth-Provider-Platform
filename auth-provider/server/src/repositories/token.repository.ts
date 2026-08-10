import { prisma } from "../../../db";
import * as clientRepository from "./client.repository";
import bcrypt from "bcrypt";

export const createToken = async (code : string, jwt: string) => {
    const authorizationCode = await prisma.authorization_codes.findUnique({
        where: { code_hash: code },
    });
    
    return await prisma.sso_sessions.create({
        data: {
            jti : bcrypt.hashSync(jwt, 10),
            user_id: authorizationCode?.user_id!,
            application_id: authorizationCode?.application_id!,
            sso_session_id: authorizationCode?.sso_session_id!,
            session_token_hash: code,
            expires_at: new Date(Date.now() + 60 * 60 * 1000), 
        }
    });
}