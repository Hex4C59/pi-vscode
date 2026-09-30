# Pattern Examples

Read when selecting a pattern under the Quality Code skill. These examples illustrate structure; adapt domain rules and error contracts to the actual task.

## Strategy

Use for interchangeable algorithms with the same input/output contract. In TypeScript, functions often supply the strategy without a class hierarchy.

```typescript
type ShippingMethod = 'standard' | 'express';
type Order = { total: number };
type ShippingStrategy = (order: Order) => number;

const shippingStrategies: Record<ShippingMethod, ShippingStrategy> = {
  standard: order => order.total >= 50 ? 0 : 5.99,
  express: order => order.total >= 100 ? 9.99 : 14.99,
};

function calculateShipping(order: Order, method: ShippingMethod): number {
  return shippingStrategies[method](order);
}
```

Validate external method values before calling this typed boundary. Test each algorithm's thresholds and preserve the existing dispatch behavior.

## Builder

Use when construction has meaningful stages or optional configuration. For a few independent fields, a typed options object is usually sufficient.

```typescript
type ReportOptions = { title: string; includeTotals: boolean };

class ReportBuilder {
  private title = '';
  private includeTotals = false;

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withTotals(): this {
    this.includeTotals = true;
    return this;
  }

  build(): ReportOptions {
    if (!this.title.trim()) {
      throw new Error('Report title is required');
    }
    return { title: this.title, includeTotals: this.includeTotals };
  }
}

const options = new ReportBuilder().withTitle('Sales').withTotals().build();
```

Final construction validates required invariants and returns a fresh result. Test incomplete construction and ensure later builder mutations do not mutate previously built results.

## Chain of Responsibility

Use for ordered handlers with explicit short-circuit rules. A function sequence can express the chain without a linked class hierarchy.

```typescript
type Request = { userId?: string; amount: number };
type ValidationError = 'missing-user' | 'invalid-amount';
type Validator = (request: Request) => ValidationError | null;

const validators: readonly Validator[] = [
  request => request.userId ? null : 'missing-user',
  request => Number.isFinite(request.amount) && request.amount > 0
    ? null
    : 'invalid-amount',
];

function validateRequest(request: Request): ValidationError | null {
  for (const validate of validators) {
    const error = validate(request);
    if (error !== null) return error;
  }
  return null;
}
```

This chain returns the first failure. Test handler order and short-circuiting; use a different contract if the application must collect all errors rather than stop at the first.
