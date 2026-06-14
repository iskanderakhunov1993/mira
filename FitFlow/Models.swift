import Foundation

struct DailyGoals: Codable {
    var calories = 2200
    var protein = 145
    var carbohydrates = 245
    var fat = 70
    var waterML = 2500
}

struct MealEntry: Identifiable, Codable {
    let id: UUID
    let date: Date
    var title: String
    var calories: Int
    var protein: Int
    var carbohydrates: Int
    var fat: Int
    var confidence: Double

    init(
        id: UUID = UUID(),
        date: Date = .now,
        title: String,
        calories: Int,
        protein: Int,
        carbohydrates: Int,
        fat: Int,
        confidence: Double
    ) {
        self.id = id
        self.date = date
        self.title = title
        self.calories = calories
        self.protein = protein
        self.carbohydrates = carbohydrates
        self.fat = fat
        self.confidence = confidence
    }
}

struct Workout: Identifiable {
    let id = UUID()
    let title: String
    let focus: String
    let durationMinutes: Int
    let exercises: [Exercise]
}

struct Exercise: Identifiable {
    let id = UUID()
    let name: String
    let detail: String
    let symbol: String
}

struct BodyAssessment {
    let summary: String
    let focusAreas: [String]
    let nextCheckInDays: Int
}

struct MealAnalysis {
    let title: String
    let calorieRange: ClosedRange<Int>
    let protein: Int
    let carbohydrates: Int
    let fat: Int
    let confidence: Double

    var estimatedCalories: Int {
        (calorieRange.lowerBound + calorieRange.upperBound) / 2
    }
}
