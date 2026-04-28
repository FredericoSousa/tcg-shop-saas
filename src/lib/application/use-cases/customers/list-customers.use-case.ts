import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";
import { IUseCase } from "../use-case.interface";

export interface ListCustomersRequest {
  page: number;
  limit: number;
  filters: {
    search?: string;
    includeDeleted?: boolean;
  };
}

export interface ListCustomersResponse {
  items: Customer[];
  total: number;
  pageCount: number;
}

@injectable()
export class ListCustomersUseCase implements IUseCase<ListCustomersRequest, ListCustomersResponse> {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(request: ListCustomersRequest): Promise<ListCustomersResponse> {
    const page = Math.max(1, request.page);
    const limit = Math.max(1, request.limit);
    const { filters } = request;
    
    const { items, total } = await this.customerRepo.findPaginated(page, limit, filters);
    
    return {
      items,
      total,
      pageCount: Math.ceil(total / limit) || 1,
    };
  }
}
