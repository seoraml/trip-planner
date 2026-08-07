import type { SettlementTransfer, UUID } from "@/types/domain";

// Greedy debt simplification: repeatedly match the largest creditor with the
// largest debtor until every balance is settled. Produces close to the
// minimum number of transfers, which is what matters for a "who pays whom"
// summary (exact minimum-transfer optimization isn't worth the complexity here).
export function computeSettlement(balances: Record<UUID, number>): SettlementTransfer[] {
  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < 0)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);
    if (amount > 0) {
      transfers.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amount });
    }
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount <= 0) ci++;
    if (debtor.amount <= 0) di++;
  }
  return transfers;
}
