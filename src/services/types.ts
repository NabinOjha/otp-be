export interface IOtpRecord {
  id: number;
  phone: string;
  code: string;
  expiresAt: Date;
  verified: boolean | null;
  createdAt: Date | null;
}

export interface IOtpConfig {
  length?: number;
  expiryMinutes?: number;
}
