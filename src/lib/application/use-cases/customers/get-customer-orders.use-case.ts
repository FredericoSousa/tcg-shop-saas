import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { Order } from "@/lib/domain/entities/order";
import { IUseCase } from "../use-case.interface";

export interface GetCustomerOrdersRequest {
  customerId: string;
  page: number;
  limit: number;
}

export interface GetCustomerOrdersResponse {
  items: Order[];
  total: number;
  pageCount: number;
}

@injectable()
export class GetCustomerOrdersUseCase implements IUseCase<GetCustomerOrdersRequest, GetCustomerOrdersResponse> {
  constructor(@inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository) {}

  async execute(request: GetCustomerOrdersRequest): Promise<GetCustomerOrdersResponse> {
    const { customerId, page, limit } = request;
    const { items, total } = await this.orderRepo.findPaginated(page, limit, { customerId });
    
    return {
      items,
      total,
      pageCount: Math.ceil(total / limit) || 1,
    };
  }
}
