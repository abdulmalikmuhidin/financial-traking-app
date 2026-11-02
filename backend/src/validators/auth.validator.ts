export class AuthValidator {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private static readonly CODE_REGEX = /^\d{6}$/;

  static isValidEmail(email?: string | null): boolean {
    if (!email || typeof email !== 'string') return false;
    return this.EMAIL_REGEX.test(email.trim());
  }

  static isValidCode(code?: any): boolean {
    if (code === undefined || code === null) return false;
    return this.CODE_REGEX.test(code.toString().trim());
  }

  static validateRegister(body: any): string | null {
    const { name, email, password } = body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return 'Full name is required (minimum 2 characters).';
    }
    if (!this.isValidEmail(email)) {
      return 'A valid email address is required.';
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  }

  static validateLogin(body: any): string | null {
    const { email, password } = body;
    if (!email || !password) {
      return 'Email and password are required.';
    }
    if (!this.isValidEmail(email)) {
      return 'A valid email address is required.';
    }
    return null;
  }

  static validateEmailOnly(body: any): string | null {
    const { email } = body;
    if (!this.isValidEmail(email)) {
      return 'A valid email address is required.';
    }
    return null;
  }

  static validateVerifyEmail(targetEmail: string, code: any): string | null {
    if (!targetEmail || !this.isValidEmail(targetEmail)) {
      return 'A valid email address is required.';
    }
    if (!this.isValidCode(code)) {
      return 'A valid 6-digit verification code is required.';
    }
    return null;
  }

  static validateResetPassword(body: any): string | null {
    const { email, code, newPassword } = body;
    if (!this.isValidEmail(email)) {
      return 'A valid email address is required.';
    }
    if (!this.isValidCode(code)) {
      return 'A valid 6-digit reset code is required.';
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return 'New password must be at least 6 characters.';
    }
    return null;
  }

  static validateOtpLogin(body: any): string | null {
    const { email, code } = body;
    if (!this.isValidEmail(email)) {
      return 'A valid email address is required.';
    }
    if (!this.isValidCode(code)) {
      return 'A valid 6-digit login code is required.';
    }
    return null;
  }
}
