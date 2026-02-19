import { LotEditForm } from "../LotEditForm";

export default function NewLotPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-bold text-platinum-200">New Lot</h1>
      <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
        <LotEditForm />
      </div>
    </div>
  );
}
