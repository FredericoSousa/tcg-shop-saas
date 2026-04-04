import { prisma } from "@/lib/prisma";

export async function getTenantById(id: string) {
  return await prisma.tenant.findUnique({
    where: { id },
  });
}

export async function getTenantBySlug(slug: string) {
  return await prisma.tenant.findUnique({
    where: { slug },
  });
}
