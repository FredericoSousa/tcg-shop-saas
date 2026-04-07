import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";

interface ListCustomersRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
}

@injectable()
export class ListCustomersUseCase {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(request: ListCustomersRequest): Promise<{ items: Customer[]; total: number; pageCount: number }> {
    const { tenantId, page, limit, search, includeDeleted } = request;
    const { items, total } = await this.customerRepo.findPaginated(tenantId, page, limit, { search, includeDeleted });
    
    return {
      items,
      total,
      pageCount: Math.ceil(total / limit),
    };
  }
}
