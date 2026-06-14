import SwiftUI

struct TrainingView: View {
    @EnvironmentObject private var store: AppStore
    @State private var showsAssessment = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Тренировки").font(.largeTitle.bold())
                    Text("Неделя 1 · Формируем привычку")
                        .foregroundStyle(FitTheme.muted)
                }

                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("СЕГОДНЯ")
                                .font(.caption.bold())
                                .tracking(1.2)
                                .foregroundStyle(FitTheme.lime)
                            Text(store.todayWorkout.title).font(.title2.bold())
                            Text(store.todayWorkout.focus)
                                .foregroundStyle(FitTheme.muted)
                        }
                        Spacer()
                        Text("\(store.todayWorkout.durationMinutes)\nМИН")
                            .font(.headline)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(FitTheme.lime)
                    }

                    ForEach(store.todayWorkout.exercises) { exercise in
                        HStack(spacing: 13) {
                            Image(systemName: exercise.symbol)
                                .foregroundStyle(FitTheme.lime)
                                .frame(width: 30)
                            Text(exercise.name).font(.body.weight(.medium))
                            Spacer()
                            Text(exercise.detail)
                                .font(.subheadline.monospacedDigit())
                                .foregroundStyle(FitTheme.muted)
                        }
                        .padding(.vertical, 5)
                    }

                    Button {
                        store.completedWorkout.toggle()
                    } label: {
                        Label(
                            store.completedWorkout ? "Тренировка выполнена" : "Начать тренировку",
                            systemImage: store.completedWorkout ? "checkmark.circle.fill" : "play.fill"
                        )
                        .font(.headline)
                        .foregroundStyle(store.completedWorkout ? FitTheme.lime : .black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(store.completedWorkout ? FitTheme.cardRaised : FitTheme.lime)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                }
                .fitCard()

                Button { showsAssessment = true } label: {
                    HStack(spacing: 15) {
                        Image(systemName: "viewfinder")
                            .font(.title2)
                            .foregroundStyle(FitTheme.mint)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Обновить оценку прогресса")
                                .font(.headline)
                                .foregroundStyle(.white)
                            Text("Фото используется для общих фитнес-наблюдений")
                                .font(.caption)
                                .foregroundStyle(FitTheme.muted)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(FitTheme.muted)
                    }
                    .fitCard()
                }
                .buttonStyle(.plain)
            }
            .padding(18)
        }
        .background(FitTheme.background)
        .sheet(isPresented: $showsAssessment) { BodyAssessmentView() }
    }
}
