import { prisma } from "../../../db";

export const validateClientID = async (clientId: string) => {
    const client = await prisma.applications.findUnique({
        where: { client_id: clientId },
    });

    return client;
};

export const getClientBySecret = async (clientSecretHash: string) => {
    return await prisma.applications.findUnique({
        where: { client_secret_hash: clientSecretHash },
    });
};

export const validateRedirectURI = async (clientId: string, redirectURI: string) => {
    const client = await prisma.applications.findUnique({
        where: { client_id: clientId },
    });

    if (!client) {
        return false;
    }

    const redirectURIs = await prisma.application_redirect_uris.findMany({
        where: { application_id: client.id },
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

export const getAuthorizationCode = async (code_hash: string) => {
    return await prisma.authorization_codes.findUnique({
        where: { code_hash: code_hash },
    });
}

export const consumeAuthorizationCode = async (id: string) => {
    return await prisma.authorization_codes.update({
        where: { id: id },
        data: { used_at: new Date() },
    });
}
