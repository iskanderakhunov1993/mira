import { Card } from "@/components/ui/card";

type PurposeItem = {
  label: string;
  title: string;
  body: string;
};

export function PagePurposeCard({ items }: { items: PurposeItem[] }) {
  return (
    <Card className="border-mira-lavender/20 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <div key={item.label} className="rounded-2xl bg-mira-bg px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mira-lavender-light text-[11px] font-black text-mira-primary">
                {index + 1}
              </span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-mira-muted">{item.label}</p>
            </div>
            <p className="text-sm font-bold text-mira-text">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-mira-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
