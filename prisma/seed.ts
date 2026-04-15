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

  // Create some Card Templates
  const card1 = await prisma.cardTemplate.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Black Lotus",
      set: "Alpha",
      game: "MAGIC",
      imageUrl: "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
    }
  });

  const card2 = await prisma.cardTemplate.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Charizard",
      set: "Base Set",
      game: "POKEMON",
      imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    }
  });

  // Add items to Tenant 1's Buylist
  await prisma.buylistItem.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      tenantId: tenant1.id,
      cardTemplateId: card1.id,
      priceCash: 50000,
      priceCredit: 65000,
      active: true,
    }
  });

  await prisma.buylistItem.upsert({
    where: { id: "00000000-0000-0000-0000-000000000102" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000102",
      tenantId: tenant1.id,
      cardTemplateId: card2.id,
      priceCash: 250,
      priceCredit: 325,
      active: true,
    }
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
