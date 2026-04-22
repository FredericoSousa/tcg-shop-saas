import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function upsertAdmin(email: string, password: string, tenantId: string) {
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const match = existing?.users.find((u) => u.email === email);

  if (match) {
    await supabaseAdmin.auth.admin.updateUserById(match.id, {
      password,
      app_metadata: { tenantId, role: "ADMIN" },
    });
    return match;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { tenantId, role: "ADMIN" },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Falha ao criar admin");
  return data.user;
}

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

  const admin1 = await upsertAdmin("admin@loja1.test", "Admin@123456", tenant1.id);
  const admin2 = await upsertAdmin("admin@cavernadodragao.test", "Admin@123456", tenant2.id);

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

  console.log(`✅ Tenants criados: ${tenant1.slug}, ${tenant2.slug}`);
  console.log(`✅ Admins criados: ${admin1.email} (${tenant1.slug}), ${admin2.email} (${tenant2.slug})`);
  console.log(`📝 Senha padrão: Admin@123456`);
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
