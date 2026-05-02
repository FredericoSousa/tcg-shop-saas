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
  active: boolean;
  brandColor: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
