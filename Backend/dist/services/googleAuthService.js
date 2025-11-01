"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
class GoogleAuthService {
    constructor() {
        this.client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    }
    async verifyToken(token) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error("Invalid Google token");
            }
            console.log("Google payload:", payload);
            return {
                googleId: payload.sub,
                email: payload.email,
                firstName: payload.given_name,
                lastName: payload.family_name,
                picture: payload.picture,
                emailVerified: payload.email_verified,
            };
        }
        catch (error) {
            throw new Error("Google token verification failed");
        }
    }
}
exports.googleAuthService = new GoogleAuthService();
