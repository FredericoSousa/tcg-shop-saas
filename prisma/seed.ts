import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  console.log("Starting seed...");

  const tenant1 = await prisma.tenant.upsert({
    where: { slug: "loja1" },
    update: {},
    create: {
      slug: "loja1",
      name: "Loja Nexus TCG",
      active: true,
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: "cavernadodragao" },
    update: {},
    create: {
      slug: "cavernadodragao",
      name: "Caverna do Dragão TCG",
      active: true,
    },
  });

  // Create test users for each tenant
  const hashedPassword = await hash("admin123", 12);

  const user1 = await prisma.user.upsert({
    where: { username_tenantId: { username: "admin", tenantId: tenant1.id } },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      tenantId: tenant1.id,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username_tenantId: { username: "admin", tenantId: tenant2.id } },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      tenantId: tenant2.id,
    },
  });

  console.log(
    `✅ Tenants criados para testes: ${tenant1.slug}, ${tenant2.slug}`,
  );
  console.log(
    `✅ Usuários de teste criados: ${user1.username} (${tenant1.slug}), ${user2.username} (${tenant2.slug})`,
  );
  console.log(`📝 Credenciais padrão - Username: admin, Senha: admin123`);
  console.log(" Seed finalizado com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
