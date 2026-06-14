import PhotosUI
import SwiftUI

struct MealScanView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: AppStore
    @State private var photoItem: PhotosPickerItem?
    @State private var phase: ScanPhase = .selecting
    @State private var analysis: MealAnalysis?
    private let analyzer: AIAnalyzing = DemoAIAnalyzer()

    var body: some View {
        NavigationStack {
            ZStack {
                FitTheme.background.ignoresSafeArea()
                VStack(spacing: 22) {
                    switch phase {
                    case .selecting:
                        selectionContent
                    case .analyzing:
                        ProgressView()
                            .scaleEffect(1.4)
                        Text("Распознаем блюдо и оцениваем порцию…")
                            .foregroundStyle(FitTheme.muted)
                    case .result:
                        if let analysis { resultContent(analysis) }
                    }
                }
                .padding(22)
            }
            .navigationTitle("Добавить прием пищи")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Закрыть") { dismiss() }
                }
            }
            .onChange(of: photoItem) { _, newValue in
                if newValue != nil { analyze() }
            }
        }
    }

    private var selectionContent: some View {
        VStack(spacing: 20) {
            Spacer()
            RoundedRectangle(cornerRadius: 30)
                .fill(FitTheme.card)
                .aspectRatio(0.88, contentMode: .fit)
                .overlay {
                    VStack(spacing: 15) {
                        Image(systemName: "camera.viewfinder")
                            .font(.system(size: 62))
                            .foregroundStyle(FitTheme.lime)
                        Text("Сфотографируй блюдо сверху")
                            .font(.title3.bold())
                        Text("Лучше, если все ингредиенты видны и рядом есть ориентир размера.")
                            .font(.subheadline)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(FitTheme.muted)
                            .padding(.horizontal, 30)
                    }
                }
            PhotosPicker(selection: $photoItem, matching: .images) {
                Label("Выбрать фото", systemImage: "photo.fill")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(FitTheme.lime)
                    .clipShape(RoundedRectangle(cornerRadius: 17))
            }
            Button("Запустить демо без фото") { analyze() }
                .foregroundStyle(FitTheme.muted)
            Spacer()
        }
    }

    private func resultContent(_ result: MealAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 45))
                .foregroundStyle(FitTheme.lime)
            Text(result.title).font(.title2.bold())
            Text("примерно \(result.calorieRange.lowerBound)–\(result.calorieRange.upperBound) ккал")
                .font(.title3)
                .foregroundStyle(FitTheme.lime)
            HStack {
                NutrientPill(title: "Белки", value: result.protein)
                NutrientPill(title: "Углеводы", value: result.carbohydrates)
                NutrientPill(title: "Жиры", value: result.fat)
            }
            HStack {
                Image(systemName: "scope")
                Text("Уверенность оценки: \(Int(result.confidence * 100))%")
            }
            .font(.subheadline)
            .foregroundStyle(FitTheme.muted)

            Text("Проверь название и порцию. Соусы, масло и скрытые ингредиенты могут заметно изменить результат.")
                .font(.subheadline)
                .foregroundStyle(FitTheme.muted)
                .fitCard()

            Spacer()
            Button {
                store.addMeal(from: result)
                dismiss()
            } label: {
                Text("Подтвердить и добавить")
                    .font(.headline)
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(FitTheme.lime)
                    .clipShape(RoundedRectangle(cornerRadius: 17))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func analyze() {
        phase = .analyzing
        Task {
            analysis = try? await analyzer.analyzeMeal()
            phase = .result
        }
    }
}

private enum ScanPhase {
    case selecting
    case analyzing
    case result
}

private struct NutrientPill: View {
    let title: String
    let value: Int

    var body: some View {
        VStack(spacing: 4) {
            Text("\(value) г").font(.headline)
            Text(title).font(.caption).foregroundStyle(FitTheme.muted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 13)
        .background(FitTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 15))
    }
}

struct BodyAssessmentView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var isAnalyzing = false
    @State private var assessment: BodyAssessment?
    private let analyzer: AIAnalyzing = DemoAIAnalyzer()

    var body: some View {
        NavigationStack {
            ZStack {
                FitTheme.background.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        if isAnalyzing {
                            ProgressView("Анализируем общие пропорции и позу…")
                                .frame(maxWidth: .infinity, minHeight: 360)
                        } else if let assessment {
                            Image(systemName: "figure.arms.open")
                                .font(.system(size: 52))
                                .foregroundStyle(FitTheme.mint)
                            Text("Рекомендация обновлена").font(.title2.bold())
                            Text(assessment.summary).foregroundStyle(FitTheme.muted)
                            ForEach(assessment.focusAreas, id: \.self) { area in
                                Label(area, systemImage: "checkmark.circle.fill")
                                    .foregroundStyle(FitTheme.mint)
                            }
                            Text("Следующая сверка через \(assessment.nextCheckInDays) дней")
                                .font(.subheadline.bold())
                                .padding(.top, 8)
                        } else {
                            Text("Оценка прогресса").font(.title2.bold())
                            Text("Для MVP анализ дает только общие фитнес-наблюдения. Он не определяет процент жира, заболевания или состояние здоровья.")
                                .foregroundStyle(FitTheme.muted)
                            VStack(alignment: .leading, spacing: 12) {
                                Label("Нейтральная стойка", systemImage: "figure.stand")
                                Label("Хорошее равномерное освещение", systemImage: "sun.max.fill")
                                Label("Облегающая спортивная одежда", systemImage: "tshirt.fill")
                            }
                            .fitCard()
                            Button("Запустить демо-анализ") { analyze() }
                                .font(.headline)
                                .foregroundStyle(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(FitTheme.lime)
                                .clipShape(RoundedRectangle(cornerRadius: 17))
                        }
                    }
                    .padding(22)
                }
            }
            .navigationTitle("AI-оценка")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Закрыть") { dismiss() }
                }
            }
        }
    }

    private func analyze() {
        isAnalyzing = true
        Task {
            assessment = try? await analyzer.assessBody()
            isAnalyzing = false
        }
    }
}
