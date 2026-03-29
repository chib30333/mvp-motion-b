import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.ts';

export type AccessTokenPayload = {
    sub: string;
    email: string;
    role: string;
};

export type RefreshTokenPayload = {
    sub: string;
    type: 'refresh';
};

function signJwt(payload: object, secret: Secret, options: SignOptions): string {
    return jwt.sign(payload, secret, options);
}

export function signAccessToken(payload: AccessTokenPayload): string {
    return signJwt(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    });
}

export function signRefreshToken(userId: string): string {
    return signJwt(
        {
            sub: userId,
            type: 'refresh',
        },
        env.JWT_REFRESH_SECRET,
        {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
        }
    );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}