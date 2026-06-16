import Foundation

protocol AIAnalyzing {
    func analyzeMeal() async throws -> MealAnalysis
    func assessBody() async throws -> BodyAssessment
}

struct DemoAIAnalyzer: AIAnalyzing {
    func analyzeMeal() async throws -> MealAnalysis {
        try await Task.sleep(for: .seconds(1.4))
        return MealAnalysis(
            title: "Лосось, киноа и овощи",
            calorieRange: 590...710,
            protein: 42,
            carbohydrates: 58,
            fat: 27,
            confidence: 0.84
        )
    }

    func assessBody() async throws -> BodyAssessment {
        try await Task.sleep(for: .seconds(1.6))
        return BodyAssessment(
            summary: "Для вашей цели полезно укреплять корпус и постепенно увеличивать общую силовую нагрузку.",
            focusAreas: ["Корпус и стабильность", "Сила ног", "Осанка и мобильность"],
            nextCheckInDays: 14
        )
    }
}
