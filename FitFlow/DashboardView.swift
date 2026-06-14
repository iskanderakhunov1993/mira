import Foundation
import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var store: AppStore
    @State private var showsMealScan = false
    private let currentDate = Date.now.formatted(
        .dateTime
            .locale(Locale(identifier: "ru_RU"))
            .weekday(.wide)
            .day()
            .month(.wide)
    )

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    header
                    dailyOverview
                    hydrationCard
                    workoutCard
                    coachCard
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 28)
            }
            .background(FitTheme.background)
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showsMealScan) {
                MealScanView()
            }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(currentDate.uppercased())
                    .font(.caption.bold())
                    .tracking(1.2)
                    .foregroundStyle(FitTheme.lime)
                Text("Добрый день, Искандер")
                    .font(.title2.bold())
            }
            Spacer()
            Circle()
                .fill(FitTheme.cardRaised)
                .frame(width: 44, height: 44)
                .overlay(Image(systemName: "person.fill").foregroundStyle(FitTheme.muted))
        }
        .padding(.top, 12)
    }

    private var dailyOverview: some View {
        VStack(spacing: 20) {
            HStack {
                ProgressRing(
                    progress: Double(store.consumedCalories) / Double(store.goals.calories),
                    value: "\(store.caloriesRemaining)",
                    caption: "ккал осталось"
                )
                Spacer()
                VStack(alignment: .leading, spacing: 13) {
                    MacroRow(title: "Белки", value: store.consumedProtein, goal: store.goals.protein, color: FitTheme.mint)
                    MacroRow(title: "Углеводы", value: store.consumedCarbohydrates, goal: store.goals.carbohydrates, color: FitTheme.blue)
                    MacroRow(title: "Жиры", value: store.consumedFat, goal: store.goals.fat, color: .orange)
                }
                .frame(width: 170)
            }

            Button {
                showsMealScan = true
            } label: {
                Label("Сфотографировать еду", systemImage: "camera.fill")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(FitTheme.lime)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
        }
        .fitCard()
    }

    private var hydrationCard: some View {
        VStack(alignment: .leading, spacing: 15) {
            SectionHeader(title: "Вода", action: "\(store.waterML) / \(store.goals.waterML) мл")
            ProgressView(value: Double(store.waterML), total: Double(store.goals.waterML))
                .tint(FitTheme.blue)
            Text(store.hydrationPrompt)
                .font(.subheadline)
                .foregroundStyle(FitTheme.muted)
            HStack(spacing: 10) {
                WaterButton(amount: 250) { store.addWater(250) }
                WaterButton(amount: 350) { store.addWater(350) }
                WaterButton(amount: 500) { store.addWater(500) }
            }
        }
        .fitCard()
    }

    private var workoutCard: some View {
        NavigationLink(destination: TrainingView()) {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 18)
                        .fill(FitTheme.mint.opacity(0.14))
                        .frame(width: 70, height: 78)
                    Image(systemName: "figure.strengthtraining.traditional")
                        .font(.system(size: 30))
                        .foregroundStyle(FitTheme.mint)
                }
                VStack(alignment: .leading, spacing: 5) {
                    Text("ТРЕНИРОВКА ДНЯ")
                        .font(.caption.bold())
                        .tracking(1)
                        .foregroundStyle(FitTheme.mint)
                    Text(store.todayWorkout.title)
                        .font(.headline)
                        .foregroundStyle(.white)
                    Text("\(store.todayWorkout.durationMinutes) мин · \(store.todayWorkout.exercises.count) упражнения")
                        .font(.subheadline)
                        .foregroundStyle(FitTheme.muted)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(FitTheme.muted)
            }
            .fitCard()
        }
        .buttonStyle(.plain)
    }

    private var coachCard: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "sparkles")
                .foregroundStyle(FitTheme.lime)
            VStack(alignment: .leading, spacing: 6) {
                Text("Фокус на сегодня").font(.headline)
                Text("После двух приемов пищи белка пока меньше половины нормы. Добавь белковый продукт к ужину.")
                    .font(.subheadline)
                    .foregroundStyle(FitTheme.muted)
            }
        }
        .fitCard()
    }
}

private struct MacroRow: View {
    let title: String
    let value: Int
    let goal: Int
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(title).font(.caption)
                Spacer()
                Text("\(value)/\(goal) г")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(FitTheme.muted)
            }
            ProgressView(value: Double(value), total: Double(goal)).tint(color)
        }
    }
}

private struct WaterButton: View {
    let amount: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("+\(amount)")
                .font(.subheadline.bold())
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(FitTheme.cardRaised)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}
