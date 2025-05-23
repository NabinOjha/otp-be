type OtpEntry = {
  code: string;
  expiresAt: number;
};

export class Otp {
  private store: Map<string, OtpEntry>;
  private ttl: number; // Time to live in milliseconds

  constructor(ttlMinutes = 5) {
    this.store = new Map();
    this.ttl = ttlMinutes * 60 * 1000; // e.g. 5 minutes
  }

  private generateCode(length = 6): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  }

  send(phone: string): string {
    const code = this.generateCode();
    const expiresAt = Date.now() + this.ttl;

    this.store.set(phone, { code, expiresAt });

    // Simulate sending (you'd call a service here)
    console.log(`Sending OTP ${code} to ${phone}`);

    return code;
  }

  verify(phone: string, inputCode: string): boolean {
    const entry = this.store.get(phone);

    if (!entry) return false;

    const { code, expiresAt } = entry;

    const isValid = code === inputCode && Date.now() <= expiresAt;

    // Auto-remove after verification attempt (optional)
    if (isValid) this.store.delete(phone);

    return isValid;
  }

  cleanupExpired(): void {
    const now = Date.now();
    for (const [phone, { expiresAt }] of this.store.entries()) {
      if (expiresAt < now) {
        this.store.delete(phone);
      }
    }
  }
}
