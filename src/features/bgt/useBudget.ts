import { useEffect, useMemo, useState } from "react";
import type { BudgetCategoryPlan, Expense, PlaceCategory, TripMember } from "@/types/domain";
import {
  createExpense,
  createTripMember,
  deleteExpense,
  deleteTripMember,
  listBudgetCategories,
  listExpenses,
  listTripMembers,
  upsertBudgetCategory,
  type NewExpenseInput,
} from "./budgetService";
import { computeSettlement } from "./settlement";

export type BudgetLoadStatus = "loading" | "ready" | "error";

export function useBudget(tripId: string | undefined) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryPlan[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [status, setStatus] = useState<BudgetLoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    setStatus("loading");

    Promise.all([listTripMembers(tripId), listBudgetCategories(tripId), listExpenses(tripId)])
      .then(([memberRows, budgetRows, expenseRows]) => {
        if (cancelled) return;
        setMembers(memberRows);
        setBudgetCategories(budgetRows);
        setExpenses(expenseRows);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "예산 정보를 불러오지 못했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  async function addMember(name: string): Promise<void> {
    if (!tripId) return;
    const member = await createTripMember(tripId, name);
    setMembers((prev) => [...prev, member]);
  }

  async function removeMember(memberId: string): Promise<void> {
    await deleteTripMember(memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function setCategoryBudget(category: PlaceCategory, plannedAmount: number): Promise<void> {
    if (!tripId) return;
    const plan = await upsertBudgetCategory(tripId, category, plannedAmount);
    setBudgetCategories((prev) => [...prev.filter((p) => p.category !== category), plan]);
  }

  async function addExpense(input: Omit<NewExpenseInput, "tripId">): Promise<void> {
    if (!tripId) return;
    const expense = await createExpense({ ...input, tripId });
    setExpenses((prev) => [expense, ...prev]);
  }

  async function removeExpense(expenseId: string): Promise<void> {
    await deleteExpense(expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  }

  const spentByCategory = useMemo(() => {
    const map = new Map<PlaceCategory, number>();
    for (const expense of expenses) {
      map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
    }
    return map;
  }, [expenses]);

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const totalPlanned = useMemo(
    () => budgetCategories.reduce((sum, b) => sum + b.plannedAmount, 0),
    [budgetCategories]
  );

  const settlement = useMemo(() => {
    const balances: Record<string, number> = {};
    for (const member of members) balances[member.id] = 0;

    for (const expense of expenses) {
      if (expense.paidBy && expense.paidBy in balances) {
        balances[expense.paidBy] += expense.amount;
      }
      const n = expense.splitMemberIds.length;
      if (n > 0) {
        const share = Math.round(expense.amount / n);
        for (const memberId of expense.splitMemberIds) {
          if (memberId in balances) balances[memberId] -= share;
        }
      }
    }

    return computeSettlement(balances);
  }, [members, expenses]);

  return {
    members,
    budgetCategories,
    expenses,
    status,
    error,
    addMember,
    removeMember,
    setCategoryBudget,
    addExpense,
    removeExpense,
    spentByCategory,
    totalSpent,
    totalPlanned,
    settlement,
  };
}
