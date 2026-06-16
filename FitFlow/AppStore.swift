import Combine
import Foundation

@MainActor
final class AppStore: ObservableObject {
    @Published var goals = DailyGoals()
    @Published var waterML = 1350
    @Published var meals: [MealEntry] = [
        MealEntry(title: "Омлет и авокадо", calories: 510, protein: 29, carbohydrates: 31, fat: 30, confidence: 0.88),
        MealEntry(title: "Курица с рисом", calories: 640, protein: 48, carbohydrates: 73, fat: 17, confidence: 0.82)
    ]
    @Published var completedWorkout = false
    @Published var isPremium = false

    let todayWorkout = Workout(
        title: "Сильное всё тело",
        focus: "Сила · базовый уровень",
        durationMinutes: 34,
        exercises: [
            Exercise(name: "Приседания", detail: "3 × 12", symbol: "figure.strengthtraining.traditional"),
            Exercise(name: "Отжимания", detail: "3 × 10", symbol: "figure.core.training"),
            Exercise(name: "Тяга в наклоне", detail: "3 × 12", symbol: "dumbbell.fill"),
            Exercise(name: "Планка", detail: "3 × 40 сек", symbol: "timer")
        ]
    )

    var consumedCalories: Int { meals.reduce(0) { $0 + $1.calories } }
    var consumedProtein: Int { meals.reduce(0) { $0 + $1.protein } }
    var consumedCarbohydrates: Int { meals.reduce(0) { $0 + $1.carbohydrates } }
    var consumedFat: Int { meals.reduce(0) { $0 + $1.fat } }
    var caloriesRemaining: Int { max(goals.calories - consumedCalories, 0) }

    var hydrationPrompt: String {
        let remaining = max(goals.waterML - waterML, 0)
        if remaining == 0 { return "Цель по воде выполнена. Отличная работа." }
        if remaining <= 500 { return "Осталось \(remaining) мл. Выпей стакан до вечера." }
        return "До дневной цели ещё \(remaining) мл. Добавь стакан сейчас."
    }

    func addWater(_ amount: Int) {
        waterML = min(waterML + amount, goals.waterML + 500)
    }

    func addMeal(from analysis: MealAnalysis) {
        meals.append(
            MealEntry(
                title: analysis.title,
                calories: analysis.estimatedCalories,
                protein: analysis.protein,
                carbohydrates: analysis.carbohydrates,
                fat: analysis.fat,
                confidence: analysis.confidence
            )
        )
    }
}
