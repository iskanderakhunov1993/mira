import SwiftUI

struct ProgressScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var showsPaywall = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Прогресс").font(.largeTitle.bold())

                HStack(spacing: 12) {
                    StatCard(value: "3", label: "тренировки", symbol: "flame.fill", color: .orange)
                    StatCard(value: "82%", label: "план питания", symbol: "leaf.fill", color: FitTheme.mint)
                    StatCard(value: "6", label: "дней подряд", symbol: "bolt.fill", color: FitTheme.lime)
                }

                VStack(alignment: .leading, spacing: 16) {
                    SectionHeader(title: "Эта неделя", action: "+12%")
                    HStack(alignment: .bottom, spacing: 12) {
                        ForEach(Array([0.45, 0.7, 0.52, 0.88, 0.64, 0.95, 0.58].enumerated()), id: \.offset) { index, value in
                            VStack {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(index == 5 ? FitTheme.lime : FitTheme.cardRaised)
                                    .frame(height: 115 * value)
                                Text(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][index])
                                    .font(.caption2)
                                    .foregroundStyle(FitTheme.muted)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: 140, alignment: .bottom)
                }
                .fitCard()

                VStack(alignment: .leading, spacing: 12) {
                    Label("Персональные инсайты", systemImage: "sparkles")
                        .font(.headline)
                        .foregroundStyle(FitTheme.lime)
                    Text("Стабильность важнее идеального дня. На этой неделе ты выполнил больше плана, чем на прошлой.")
                        .foregroundStyle(FitTheme.muted)
                    if !store.isPremium {
                        Button { showsPaywall = true } label: {
                            Text("Открыть полный отчет")
                                .font(.headline)
                                .foregroundStyle(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(FitTheme.lime)
                                .clipShape(RoundedRectangle(cornerRadius: 15))
                        }
                    }
                }
                .fitCard()
            }
            .padding(18)
        }
        .background(FitTheme.background)
        .sheet(isPresented: $showsPaywall) { PaywallView() }
    }
}

private struct StatCard: View {
    let value: String
    let label: String
    let symbol: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: symbol).foregroundStyle(color)
            Text(value).font(.title2.bold())
            Text(label)
                .font(.caption)
                .foregroundStyle(FitTheme.muted)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, minHeight: 95, alignment: .leading)
        .padding(13)
        .background(FitTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}

struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: AppStore

    var body: some View {
        ZStack {
            FitTheme.background.ignoresSafeArea()
            VStack(spacing: 24) {
                Spacer()
                Image(systemName: "sparkles.rectangle.stack.fill")
                    .font(.system(size: 58))
                    .foregroundStyle(FitTheme.lime)
                Text("FitFlow Pro")
                    .font(.system(size: 36, weight: .black, design: .rounded))
                Text("Безлимитный AI-анализ еды, адаптация тренировок и полный отчет о прогрессе.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(FitTheme.muted)

                VStack(alignment: .leading, spacing: 14) {
                    Label("Анализ еды по фото", systemImage: "checkmark.circle.fill")
                    Label("Персональный недельный план", systemImage: "checkmark.circle.fill")
                    Label("Динамика и умные подсказки", systemImage: "checkmark.circle.fill")
                }
                .foregroundStyle(.white)

                Spacer()
                Button {
                    store.isPremium = true
                    dismiss()
                } label: {
                    VStack(spacing: 2) {
                        Text("Попробовать 7 дней бесплатно").font(.headline)
                        Text("затем 599 ₽ / месяц").font(.caption)
                    }
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(FitTheme.lime)
                    .clipShape(RoundedRectangle(cornerRadius: 17))
                }
                Text("Демо-экран: оплата StoreKit пока не подключена")
                    .font(.caption)
                    .foregroundStyle(Color.white.opacity(0.38))
            }
            .padding(24)
        }
    }
}
