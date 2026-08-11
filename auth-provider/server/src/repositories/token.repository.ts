import { prisma } from "../../../db";
import * as clientRepository from "./client.repository";
import bcrypt from "bcrypt";

export const createToken = async (code_hash: string) => {
    const authorizationCode = await prisma.authorization_codes.findUnique({
        where: { code_hash: code_hash },
    });
    
    if (!authorizationCode) {
        return null;
    }
    
    return await prisma.access_tokens.create({
        data: {
            jti : crypto.randomUUID(),
            user_id: authorizationCode?.user_id!,
            application_id: authorizationCode?.application_id!,
            sso_session_id: authorizationCode?.sso_session_id!,
            session_token_hash: code_hash,
            expires_at: new Date(Date.now() + 60 * 60 * 1000), 
        }
    });
}