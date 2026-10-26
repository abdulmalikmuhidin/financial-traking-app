export class AuthValidator {
  static validateRegister(body: any): string | null {
    const { name, email, password } = body;
    if (!name || name.trim().length < 2) {
      return 'Full name is required (minimum 2 characters).';
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      return 'A valid email address is required.';
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  }

  static validateLogin(body: any): string | null {
    const { email, password } = body;
    if (!email || !password) {
      return 'Email and password are required.';
    }
    return null;
  }

  static validateEmailOnly(body: any): string | null {
    const { email } = body;
    if (!email || !email.includes('@')) {
      return 'A valid email address is required.';
    }
    return null;
  }

  static validateVerifyEmail(targetEmail: string, code: any): string | null {
    if (!targetEmail || !code) {
      return 'Email and 6-digit verification code are required.';
    }
    return null;
  }

  static validateResetPassword(body: any): string | null {
    const { email, code, newPassword } = body;
    if (!email || !code || !newPassword) {
      return 'Email, reset code, and new password are required.';
    }
    if (newPassword.length < 6) {
      return 'New password must be at least 6 characters.';
    }
    return null;
  }

  static validateOtpLogin(body: any): string | null {
    const { email, code } = body;
    if (!email || !code) {
      return 'Email and 6-digit login code are required.';
    }
    return null;
  }
}
