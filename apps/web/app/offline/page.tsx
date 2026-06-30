import { Card } from "@/components/ui/card";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-5 py-10 text-[#1A1A1A]">
      <Card className="max-w-md rounded-2xl border-0 bg-white p-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="text-6xl">📴</div>
        <h1 className="mt-5 text-2xl font-black">Ты офлайн</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-[#8E8E93]">
          Mira продолжит открываться с сохранёнными данными. Когда интернет вернётся, обновления подтянутся автоматически.
        </p>
      </Card>
    </main>
  );
}
