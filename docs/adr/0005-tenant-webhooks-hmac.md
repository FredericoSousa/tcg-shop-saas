# ADR 0005 — Webhooks por tenant assinados com HMAC

- **Status:** aceito
- **Data:** 2026-04-30

## Contexto

Tenants (lojas) precisam reagir em tempo real a eventos do sistema
em ferramentas próprias: ERPs, CRMs, integrações de notificação,
automações no n8n/Zapier. Pull-by-polling é caro e tem alta latência;
push é o caminho.

Requisitos:

- **Autenticidade**: o destino precisa confirmar que o request veio
  de nós, não de um atacante.
- **Anti-replay**: assinatura sozinha não basta — corpo + chave
  capturados podem ser reenviados.
- **Isolamento de falha**: um tenant com endpoint quebrado não pode
  pausar entrega para os outros.
- **Não bloquear o usuário**: a confirmação da venda no admin não
  pode ficar refém da disponibilidade do endpoint do tenant.

## Decisão

### Modelo

- Cada tenant tem `webhook_url` + `webhook_secret` opcionais
  (migration `20260430120000_tenant_webhooks`). Os dois andam juntos
  — aceitar um sem o outro é erro de validação.
- Secret rotacionado re-salvando em Settings; nunca aparece em logs
  ou response.

### Esquema de assinatura

Mesmo padrão do Stripe / GitHub:

```
signature = HMAC-SHA256(secret, `${timestamp}.${body}`)
```

Headers enviados:

| Header | Valor |
| --- | --- |
| `X-Webhook-Event` | nome do evento |
| `X-Webhook-Timestamp` | unix epoch (segundos) |
| `X-Webhook-Signature` | `sha256=<hex>` |

Razão do prefixo `timestamp.`: defeats replay entre clock skews e
faz reuso de signature para body diferente falhar (o verifier
reconstrói o prefixo).

### Resiliência de entrega

- **Circuit breaker per-tenant** (`webhook:{tenantId}`) — endpoint
  morto de um tenant só pausa entrega para ele.
- **Retry com backoff** dentro do breaker (3 tentativas).
- **Timeout** de 10s por POST (`AbortSignal.timeout(10_000)`).
- **Outbox** carrega o ciclo final: se a entrega falhar mesmo após
  retries, o evento volta como falha → o drainer conta a tentativa
  → eventualmente DLQ.

Ver detalhes em [webhooks.md](../webhooks.md) e
[events-and-outbox.md](../events-and-outbox.md).

## Consequências

**Positivas**

- Tenants têm canal de integração simples e padronizado.
- Mesmo padrão de Stripe/GitHub significa documentação trivial e
  bibliotecas existentes para verificar do lado do consumer.
- Falhas isoladas (breaker per-tenant + DLQ por evento).

**Negativas**

- Mais um ponto de operação (endpoints externos saindo do controle
  da nossa infra). Mitigado pelos padrões acima.
- Secret rotacionado quebra entregas em flight. Aceito: ops pode
  replay manualmente após consumer atualizar.
- Hoje só **um** webhook por tenant. Suficiente para o caso de uso;
  multiplexação fica para evolução (n8n/zapier mascaram isso).

## Alternativas rejeitadas

- **Sem assinatura, só HTTPS**: não autentica origem.
- **Assinatura simples (HMAC do body sem timestamp)**: vulnerável
  a replay.
- **mTLS**: setup operacional pesado para o tenant — barreira de
  adoção.
- **Pull (RSS/Atom)**: alta latência, custo de polling.

## Notas operacionais

- Para diagnosticar: logs com `breakerName=webhook:{tenantId}` +
  trace por correlation-id.
- Para rotacionar após vazamento: re-salvar tenant em Settings.
  Eventos em flight com secret antigo vão eventualmente para DLQ;
  replay manual após consumer atualizar.
- Endpoint do tenant deve responder **2xx em <10s** para não
  acumular timeouts.
