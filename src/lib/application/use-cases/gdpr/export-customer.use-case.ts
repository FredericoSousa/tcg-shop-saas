import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import { EntityNotFoundError } from "@/lib/domain/errors/domain.error";

export interface CustomerExport {
  exportedAt: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string;
    creditBalance: string;
    createdAt: string;
  };
  orders: unknown[];
  creditLedger: unknown[];
  buylistProposals: unknown[];
}

/**
 * GDPR Article 20 / LGPD Art. 18 right of portability. Returns every
 * piece of data the store holds about a single customer in a single
 * JSON document so the tenant can hand it to the data subject.
 *
 * Scope is one customer at a time on purpose — full-tenant export is a
 * separate use case (`ExportTenantUseCase`) because the volume and
 * legal basis differ.
 */
@injectable()
export class ExportCustomerUseCase {
  constructor(
    @inject(TOKENS.CustomerRepository) private customers: ICustomerRepository,
    @inject(TOKENS.OrderRepository) private orders: IOrderRepository,
    @inject(TOKENS.CustomerCreditLedgerRepository) private ledger: ICustomerCreditLedgerRepository,
    @inject(TOKENS.BuylistRepository) private buylists: IBuylistRepository,
  ) {}

  async execute(customerId: string): Promise<CustomerExport> {
    const customer = await this.customers.findById(customerId);
    if (!customer) throw new EntityNotFoundError("Customer", customerId);

    const [orders, ledger, buylistProposals] = await Promise.all([
      this.orders.findAllByCustomerId(customer.id),
      this.ledger.findByCustomerId(customer.id),
      this.buylists.findProposalsByCustomerId(customer.id),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        phoneNumber: customer.phoneNumber,
        creditBalance: customer.creditBalance.toString(),
        createdAt: customer.createdAt.toISOString(),
      },
      orders: orders as unknown[],
      creditLedger: ledger as unknown[],
      buylistProposals: buylistProposals as unknown[],
    };
  }
}
