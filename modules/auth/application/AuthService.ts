export class AuthService {
  validateToken(token: string): boolean {
    return token.length > 10;
  }
}
