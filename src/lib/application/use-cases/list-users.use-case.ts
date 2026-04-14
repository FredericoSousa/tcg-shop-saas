import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IUserRepository } from "@/lib/domain/repositories/user.repository";
import { User } from "@/lib/domain/entities/tenant";
import { IUseCase } from "./use-case.interface";

export interface ListUsersRequest {
  page: number;
  limit: number;
  search?: string;
}

export interface ListUsersResponse {
  items: Partial<User>[];
  total: number;
  pageCount: number;
}

@injectable()
export class ListUsersUseCase implements IUseCase<ListUsersRequest, ListUsersResponse> {
  constructor(@inject(TOKENS.UserRepository) private userRepo: IUserRepository) {}

  async execute(request: ListUsersRequest): Promise<ListUsersResponse> {
    const page = Math.max(1, request.page);
    const limit = Math.max(1, request.limit);
    const { search } = request;

    const { items, total } = await this.userRepo.findPaginated(page, limit, search);
    
    return {
      items: items.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
      })),
      total,
      pageCount: Math.ceil(total / limit) || 1,
    };
  }
}
