import { prisma } from "../../../db";
import bycrypt from "bcrypt";

export const validateClientID = async (clientId: string) => {
    const client = await prisma.applications.findUnique({
        where: { id: clientId },
    });

    return client;
};

export const validateRedirectURI = async (clientId: string, redirectURI: string) => {
    const client = await prisma.applications.findUnique({
        where: { id: clientId },
    });

    if (!client) {
        return false;
    }

    const redirectURIs = await prisma.application_redirect_uris.findMany({
        where: { application_id: clientId },
    });

    return redirectURIs.some(uri => uri.redirect_uri === redirectURI);
}

export const createAuthorizationCode = async (userId: string, applicationId: string, redirectURI: string, sso_session_id: string, code_hash: string, code_challenge: string) => {
    const expiredTime = Date.now() + 5 * 60 * 1000; 
        
    return await prisma.authorization_codes.create({
            data: {
                code_hash: code_hash,
                code_challenge: code_challenge,
                user_id: userId,
                application_id: applicationId,
                redirect_uri: redirectURI,
                sso_session_id: sso_session_id,
                expires_at: new Date(expiredTime),
            },
        });
}
