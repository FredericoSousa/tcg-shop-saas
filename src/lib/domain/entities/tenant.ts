export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  whatsapp: string | null;
  facebook: string | null;
  twitter: string | null;
}

export type UserRole = "ADMIN" | "USER";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
