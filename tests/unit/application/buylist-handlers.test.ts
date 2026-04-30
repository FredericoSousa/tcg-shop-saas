import { describe, it, expect, vi } from 'vitest';
import { notifyBuylistApproval } from '@/lib/application/events/buylist-handlers';
import { logger } from '@/lib/logger';

describe('notifyBuylistApproval', () => {
  it('logs a structured info entry without touching repositories', async () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => undefined);

    await notifyBuylistApproval({
      proposalId: 'p1',
      paymentMethod: 'STORE_CREDIT',
      tenantId: 't1',
      customerId: 'c1',
      amount: 130,
    });

    expect(infoSpy).toHaveBeenCalled();
    const message = infoSpy.mock.calls[0][0] as string;
    expect(message).toContain('p1');
    expect(message).toContain('STORE_CREDIT');
  });
});
