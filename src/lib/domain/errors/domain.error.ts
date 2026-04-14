export abstract class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID ${id} not found`, "ENTITY_NOT_FOUND");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly details?: unknown) {
    super(message, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized access") {
    super(message, "UNAUTHORIZED");
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(message, "BUSINESS_RULE_VIOLATION");
  }
}
