import SwiftUI

struct RootView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

    var body: some View {
        Group {
            if hasCompletedOnboarding {
                MainTabView()
            } else {
                OnboardingView {
                    withAnimation(.easeInOut) {
                        hasCompletedOnboarding = true
                    }
                }
            }
        }
        .tint(FitTheme.lime)
    }
}

struct OnboardingView: View {
    let complete: () -> Void

    var body: some View {
        ZStack {
            FitTheme.background.ignoresSafeArea()

            Circle()
                .fill(FitTheme.lime.opacity(0.18))
                .frame(width: 360, height: 360)
                .blur(radius: 70)
                .offset(x: 150, y: -280)

            VStack(alignment: .leading, spacing: 28) {
                Spacer()

                Image(systemName: "figure.run.circle.fill")
                    .font(.system(size: 70))
                    .foregroundStyle(FitTheme.lime)

                VStack(alignment: .leading, spacing: 12) {
                    Text("Твой ритм.\nТвой прогресс.")
                        .font(.system(size: 44, weight: .black, design: .rounded))
                        .tracking(-1.5)
                    Text("Еда, вода и тренировки в одном понятном плане. AI помогает оценивать, а решения всегда остаются за тобой.")
                        .font(.title3)
                        .foregroundStyle(FitTheme.muted)
                        .lineSpacing(5)
                }

                VStack(spacing: 14) {
                    OnboardingPoint(icon: "camera.viewfinder", text: "Оценивай прием пищи по фото")
                    OnboardingPoint(icon: "drop.fill", text: "Поддерживай водный баланс")
                    OnboardingPoint(icon: "figure.strengthtraining.traditional", text: "Тренируйся по персональному плану")
                }

                Button(action: complete) {
                    Text("Начать")
                        .font(.headline)
                        .foregroundStyle(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 17)
                        .background(FitTheme.lime)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .padding(.top, 8)

                Text("Не является медицинским сервисом. Оценки калорий приблизительны.")
                    .font(.caption)
                    .foregroundStyle(Color.white.opacity(0.38))
                    .frame(maxWidth: .infinity)

                Spacer().frame(height: 12)
            }
            .padding(.horizontal, 24)
        }
    }
}

private struct OnboardingPoint: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .foregroundStyle(FitTheme.lime)
                .frame(width: 24)
            Text(text).font(.body.weight(.medium))
            Spacer()
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Сегодня", systemImage: "house.fill") }
            NutritionView()
                .tabItem { Label("Питание", systemImage: "fork.knife") }
            TrainingView()
                .tabItem { Label("Тренировки", systemImage: "figure.run") }
            ProgressScreen()
                .tabItem { Label("Прогресс", systemImage: "chart.line.uptrend.xyaxis") }
        }
        .toolbarBackground(FitTheme.background.opacity(0.96), for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
    }
}
