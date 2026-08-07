import { supabase } from "@/lib/supabase";
import type { BudgetCategoryPlan, Expense, PlaceCategory, TripMember } from "@/types/domain";

interface TripMemberRow {
  id: string;
  trip_id: string;
  name: string;
  created_at: string;
}

function mapMemberRow(row: TripMemberRow): TripMember {
  return { id: row.id, tripId: row.trip_id, name: row.name, createdAt: row.created_at };
}

export async function listTripMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as TripMemberRow[]).map(mapMemberRow);
}

export async function createTripMember(tripId: string, name: string): Promise<TripMember> {
  const { data, error } = await supabase
    .from("trip_members")
    .insert({ trip_id: tripId, name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return mapMemberRow(data as TripMemberRow);
}

export async function deleteTripMember(memberId: string): Promise<void> {
  const { error } = await supabase.from("trip_members").delete().eq("id", memberId);
  if (error) throw error;
}

interface BudgetCategoryRow {
  trip_id: string;
  category: PlaceCategory;
  planned_amount: number | string;
}

function mapBudgetCategoryRow(row: BudgetCategoryRow): BudgetCategoryPlan {
  return { tripId: row.trip_id, category: row.category, plannedAmount: Number(row.planned_amount) };
}

export async function listBudgetCategories(tripId: string): Promise<BudgetCategoryPlan[]> {
  const { data, error } = await supabase.from("trip_budget_categories").select().eq("trip_id", tripId);
  if (error) throw error;
  return (data as BudgetCategoryRow[]).map(mapBudgetCategoryRow);
}

export async function upsertBudgetCategory(
  tripId: string,
  category: PlaceCategory,
  plannedAmount: number
): Promise<BudgetCategoryPlan> {
  const { data, error } = await supabase
    .from("trip_budget_categories")
    .upsert({ trip_id: tripId, category, planned_amount: plannedAmount })
    .select()
    .single();
  if (error) throw error;
  return mapBudgetCategoryRow(data as BudgetCategoryRow);
}

interface ExpenseRow {
  id: string;
  trip_id: string;
  category: PlaceCategory;
  amount: number | string;
  memo: string | null;
  paid_by: string | null;
  split_member_ids: string[];
  expense_date: string | null;
  created_at: string;
}

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    tripId: row.trip_id,
    category: row.category,
    amount: Number(row.amount),
    memo: row.memo ?? undefined,
    paidBy: row.paid_by,
    splitMemberIds: row.split_member_ids,
    expenseDate: row.expense_date ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listExpenses(tripId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select()
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ExpenseRow[]).map(mapExpenseRow);
}

export interface NewExpenseInput {
  tripId: string;
  category: PlaceCategory;
  amount: number;
  memo?: string;
  paidBy?: string | null;
  splitMemberIds?: string[];
  expenseDate?: string;
}

export async function createExpense(input: NewExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      trip_id: input.tripId,
      category: input.category,
      amount: input.amount,
      memo: input.memo?.trim() || null,
      paid_by: input.paidBy ?? null,
      split_member_ids: input.splitMemberIds ?? [],
      expense_date: input.expenseDate || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapExpenseRow(data as ExpenseRow);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}
