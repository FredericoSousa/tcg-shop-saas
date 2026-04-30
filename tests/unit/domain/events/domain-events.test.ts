import { describe, it, expect, beforeEach, vi } from "vitest";
import { domainEvents } from "@/lib/domain/events/domain-events";

describe("DomainEvents", () => {
  beforeEach(() => {
    domainEvents.clear();
  });

  it("delivers a published event to every subscriber", async () => {
    const a = vi.fn();
    const b = vi.fn();
    domainEvents.subscribe("topic", a);
    domainEvents.subscribe("topic", b);

    await domainEvents.publish("topic", { hello: 1 });

    expect(a).toHaveBeenCalledWith({ hello: 1 });
    expect(b).toHaveBeenCalledWith({ hello: 1 });
  });

  it("publish is a no-op when no handlers are registered", async () => {
    await expect(domainEvents.publish("nobody", {})).resolves.toBeUndefined();
  });

  it("captures handler errors without breaking the others", async () => {
    const ok = vi.fn();
    domainEvents.subscribe("e", () => Promise.reject(new Error("boom")));
    domainEvents.subscribe("e", ok);

    await expect(domainEvents.publish("e", {})).resolves.toBeUndefined();
    expect(ok).toHaveBeenCalled();
  });

  it("clear removes all subscribers", async () => {
    const fn = vi.fn();
    domainEvents.subscribe("topic", fn);
    domainEvents.clear();
    await domainEvents.publish("topic", {});
    expect(fn).not.toHaveBeenCalled();
  });
});
