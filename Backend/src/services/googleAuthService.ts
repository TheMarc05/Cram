import { OAuth2Client } from "google-auth-library";

class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
  }

  async verifyToken(token: string) {
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
        email: payload.email as string,
        firstName: payload.given_name as string,
        lastName: payload.family_name as string,
        picture: payload.picture,
        emailVerified: payload.email_verified,
      };
    } catch (error) {
      throw new Error("Google token verification failed");
    }
  }
}

export const googleAuthService = new GoogleAuthService();
