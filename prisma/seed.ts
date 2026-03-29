import "dotenv/config"
import { prisma } from "@/lib/prisma"

async function main() {
  console.log('Starting seed...')

  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'loja1' },
    update: {},
    create: {
      slug: 'loja1',
      name: 'Loja Nexus TCG',
      active: true,
    },
  })

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'cavernadodragao' },
    update: {},
    create: {
      slug: 'cavernadodragao',
      name: 'Caverna do Dragão TCG',
      active: true,
    },
  })

  console.log(`✅ Tenants criados para testes: ${tenant1.slug}, ${tenant2.slug}`)
  console.log(' Seed finalizado com sucesso.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
