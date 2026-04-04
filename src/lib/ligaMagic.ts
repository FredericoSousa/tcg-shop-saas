import { getBrowser } from './puppeteer'

type LigaMagicSet = {
    acronym: string
    dtrelease: string
    groupedurl: string
    icon: string
    id: string
    idgrouped: string
    name: string
    nameen: string
    namept: string
    nameptsa: string
}

type Set = {
    id: string
    name: string
    code: string
}

type LigaMagicCard = {
    extras: number
    foto: number
    id: number
    idEdicao: string
    idioma: string
    lj_id: number
    lj_rastreio: string
    lj_ref: string
    lj_tel: string
    lj_tel_ddd: number
    lj_tipo: number
    lj_uf: string
    num: string
    precoFinal: string
    prevEnvio: string | null
    qualid: string
    quant: number
    sellType: number
}

type Card = {
    condition: string
    price: number
    language?: string
    set: Set
    extras: string[]
}

type CollectionCard = Omit<Card, 'set'> & { set?: string, quantity: number, cardNumber: number }

export async function getCollectionById(id: string): Promise<CollectionCard[]> {

    const browser = await getBrowser();
    const page = await browser.newPage();

    const cards: CollectionCard[] = []

    const getPageCards = async (pageNumber: number) => {
        await page.goto(`https://www.ligamagic.com.br/?view=colecao/colecao&id=${id}&modoExibicao=1&page=${pageNumber}`);

        try {
            await page.waitForSelector('.pointer', { timeout: 30000 });
            const cardsOnPage = await page.evaluate(() => {
                return Array.from(
                    document.querySelectorAll(".pointer"))
                    .map(item => ({
                        quantity: Number(item?.children[0]?.textContent ?? 0),
                        name: item?.children[3]?.children[0]?.children[1]?.textContent ?? item?.children[3]?.children[0]?.children[0]?.textContent,
                        set: item?.children[2]?.children[0]?.getAttribute("data-src")?.split("/ed_mtg/")[1].split(".")[0].split('_')[0],
                        cardNumber: Number(item?.children[1]?.textContent?.replace('#', '') ?? 0),
                        price: Number(item?.children[9]?.textContent?.replace('R$', '')?.replace(',', '.') ?? 0),
                        language: item?.children[5]?.children[0]?.getAttribute('src')?.split('/bandeiras/')[1].split('.')[0],
                        condition: item?.children[6]?.textContent,
                        extras: item.children[4].textContent.split(', ').filter(Boolean)
                    }))
            })
            cards.push(...cardsOnPage)
            await getPageCards(pageNumber + 1)
        } catch (error) {
            console.log(error)
            return;
        }
    }

    await getPageCards(1)
    await browser.close()
    return cards
}

export const ligaMagicConditions: Record<string, string> = {
    "1": "M",
    "2": "NM",
    "3": "SP",
    "4": "MP",
    "5": "HP",
    "6": "D",
}

export const ligaMagicLanguages: Record<string, string> = {
    "1": "DE",
    "2": "EN",
    "3": "ES",
    "4": "FR",
    "5": "IT",
    "6": "JA",
    "7": "KO",
    "8": "PT",
    "9": "RU",
    "10": "TW",
    "11": "PT-EN",
    "12": "TK",
    "16": "PH",
    "0": "NA",
}

export const ligamagicExtras: Record<number, string> = {
    2: "FOIL",
    3: "PROMO",
    5: "PRE_RELEASE",
    7: "FNM",
    11: "DCI",
    13: "TEXTLESS",
    17: "SIGNED",
    23: "OVERSIZED",
    29: "ALTERED",
    31: "FOIL_ETCHED",
    37: "MISPRINT",
    41: "MISCUT",
}

const getExtras = (extrasTotal: number): string[] => {
    if (!extrasTotal) return []
    return Object.entries(ligamagicExtras).reduce((extras: string[], [id, extra]) => {
        if ((extrasTotal % Number(id)) === 0) {
            extras.push(extra)
        }
        return extras
    }, [])

}

export async function getSets(): Promise<Set[]> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto('https://www.ligamagic.com.br/?view=cards/edicoes')
    const sets = await page.evaluate('tcgEditions.jsonEditions.main') as LigaMagicSet[] ?? []
    await browser.close()
    return sets.map((set) => ({ id: set.id, name: set.name, code: set.acronym }))
}

export async function getCardPrices({ name, set }: { name: string, set?: string }): Promise<Card[]> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto(`https://www.ligamagic.com.br/?view=cards/card&card=${name}${set ? `&ed=${set}` : ''}`)
    await page.waitForSelector('#marketplace-stores')
    const sets = await page.evaluate('editionsCard.jsonEditions') as any[] ?? []
    const marketplaceCards = await page.evaluate('cards_stock') as LigaMagicCard[] ?? []
    await browser.close()
    return marketplaceCards.filter((card: LigaMagicCard) => card.sellType === 1)
        .map((card: LigaMagicCard) => {
            const set = sets.find((set: any) => set.id === Number(card.idEdicao))
            return {
                condition: ligaMagicConditions[card.qualid],
                price: Number(card.precoFinal ?? 0),
                language: ligaMagicLanguages[card.idioma],
                set: { code: set?.code ?? '', name: set?.name ?? '', id: card.idEdicao },
                extras: getExtras(card.extras)
            }
        })
}
