import SwiftUI

struct NutritionView: View {
    @EnvironmentObject private var store: AppStore
    @State private var showsMealScan = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Питание").font(.largeTitle.bold())
                            Text("\(store.consumedCalories) из \(store.goals.calories) ккал")
                                .foregroundStyle(FitTheme.muted)
                        }
                        Spacer()
                        Button { showsMealScan = true } label: {
                            Image(systemName: "camera.fill")
                                .font(.title3)
                                .foregroundStyle(.black)
                                .frame(width: 48, height: 48)
                                .background(FitTheme.lime)
                                .clipShape(Circle())
                        }
                    }

                    VStack(spacing: 0) {
                        ForEach(store.meals) { meal in
                            HStack(spacing: 14) {
                                RoundedRectangle(cornerRadius: 15)
                                    .fill(FitTheme.cardRaised)
                                    .frame(width: 58, height: 58)
                                    .overlay(Image(systemName: "fork.knife").foregroundStyle(FitTheme.lime))
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(meal.title).font(.headline)
                                    Text("Б \(meal.protein) · У \(meal.carbohydrates) · Ж \(meal.fat) г")
                                        .font(.caption)
                                        .foregroundStyle(FitTheme.muted)
                                }
                                Spacer()
                                Text("\(meal.calories)")
                                    .font(.headline.monospacedDigit())
                                Text("ккал")
                                    .font(.caption)
                                    .foregroundStyle(FitTheme.muted)
                            }
                            .padding(.vertical, 14)
                            if meal.id != store.meals.last?.id {
                                Divider().overlay(Color.white.opacity(0.06))
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .background(FitTheme.card)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))

                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "info.circle.fill").foregroundStyle(FitTheme.blue)
                        Text("Фото не показывает точный вес и состав блюда. Перед сохранением проверь ингредиенты и размер порции.")
                            .font(.subheadline)
                            .foregroundStyle(FitTheme.muted)
                    }
                    .fitCard()
                }
                .padding(18)
            }
            .background(FitTheme.background)
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showsMealScan) { MealScanView() }
        }
    }
}
