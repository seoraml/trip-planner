import { useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLACE_CATEGORIES } from "@/features/plc/placeCategories";
import type { PlaceCategory, TripMember } from "@/types/domain";
import type { NewExpenseInput } from "./budgetService";
import { useBudget } from "./useBudget";

interface Props {
  tripId: string;
  readOnly: boolean;
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function BudgetPanel({ tripId, readOnly }: Props) {
  const {
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
  } = useBudget(tripId);

  const membersById = new Map(members.map((m) => [m.id, m]));

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">예산 정보를 불러오는 중...</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">총 지출{totalPlanned > 0 && " / 예산"}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {formatWon(totalSpent)}
          {totalPlanned > 0 && (
            <span className="ml-1 text-base font-normal text-muted-foreground">
              / {formatWon(totalPlanned)}
            </span>
          )}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">카테고리별 예산</h3>
        {PLACE_CATEGORIES.map((category) => (
          <CategoryBudgetRow
            key={category}
            category={category}
            planned={budgetCategories.find((b) => b.category === category)?.plannedAmount ?? 0}
            spent={spentByCategory.get(category) ?? 0}
            readOnly={readOnly}
            onChangePlanned={(amount) => setCategoryBudget(category, amount)}
          />
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">참가자</h3>
        <div className="flex flex-wrap gap-1.5">
          {members.map((member) => (
            <span
              key={member.id}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm text-foreground"
            >
              {member.name}
              {!readOnly && (
                <button
                  type="button"
                  aria-label="참가자 삭제"
                  onClick={() => removeMember(member.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">아직 등록된 참가자가 없어요.</p>
          )}
        </div>
        {!readOnly && <AddMemberForm onAdd={addMember} />}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">지출 내역</h3>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 등록된 지출이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {expense.category} · {formatWon(expense.amount)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {expense.paidBy ? (membersById.get(expense.paidBy)?.name ?? "?") : "낸 사람 미지정"} 결제
                    {expense.splitMemberIds.length > 0 &&
                      ` · ${expense.splitMemberIds
                        .map((id) => membersById.get(id)?.name ?? "?")
                        .join(", ")}과 분담`}
                    {expense.memo && ` · ${expense.memo}`}
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="지출 삭제"
                    onClick={() => removeExpense(expense.id)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!readOnly && <AddExpenseForm members={members} onAdd={addExpense} />}
      </section>

      {members.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">정산</h3>
          {settlement.length === 0 ? (
            <p className="text-sm text-muted-foreground">정산할 금액이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {settlement.map((transfer, index) => (
                <li key={index} className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">
                  {membersById.get(transfer.fromMemberId)?.name ?? "?"} →{" "}
                  {membersById.get(transfer.toMemberId)?.name ?? "?"}{" "}
                  <span className="font-semibold">{formatWon(transfer.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function CategoryBudgetRow({
  category,
  planned,
  spent,
  readOnly,
  onChangePlanned,
}: {
  category: PlaceCategory;
  planned: number;
  spent: number;
  readOnly: boolean;
  onChangePlanned: (amount: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(planned || ""));
  const pct = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;
  const over = planned > 0 && spent > planned;

  async function handleSave() {
    const amount = Number(value);
    if (!Number.isNaN(amount) && amount >= 0) {
      await onChangePlanned(amount);
    }
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{category}</span>
        {editing ? (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-7 w-28 text-right"
            autoFocus
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
        ) : (
          <button
            type="button"
            disabled={readOnly}
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground disabled:pointer-events-none"
          >
            {formatWon(spent)}
            {planned > 0 && ` / ${formatWon(planned)}`}
          </button>
        )}
      </div>
      {planned > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${over ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function AddMemberForm({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd(name.trim());
      setName("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 추가"
        className="h-8 flex-1"
      />
      <Button type="submit" size="sm" variant="outline" disabled={isSubmitting}>
        <Plus />
      </Button>
    </form>
  );
}

function AddExpenseForm({
  members,
  onAdd,
}: {
  members: TripMember[];
  onAdd: (input: Omit<NewExpenseInput, "tripId">) => Promise<void>;
}) {
  const [category, setCategory] = useState<PlaceCategory>("기타");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitIds, setSplitIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSplit(id: string) {
    setSplitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError("금액을 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd({
        category,
        amount: value,
        memo: memo || undefined,
        paidBy: paidBy || null,
        splitMemberIds: splitIds,
      });
      setAmount("");
      setMemo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "지출을 추가하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-3.5"
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-category">카테고리</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as PlaceCategory)}>
            <SelectTrigger id="expense-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLACE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-amount">금액</Label>
          <Input
            id="expense-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10000"
          />
        </div>
      </div>

      {members.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-paidBy">낸 사람</Label>
          <Select value={paidBy || undefined} onValueChange={setPaidBy}>
            <SelectTrigger id="expense-paidBy" className="w-full">
              <SelectValue placeholder="선택 안 함" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {members.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>같이 나눈 사람</Label>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => toggleSplit(m.id)}
                className={
                  "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                  (splitIds.includes(m.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted")
                }
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-memo">메모</Label>
        <Input id="expense-memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="sm" disabled={isSubmitting} className="self-start">
        <Plus />
        {isSubmitting ? "추가 중..." : "지출 추가"}
      </Button>
    </form>
  );
}
