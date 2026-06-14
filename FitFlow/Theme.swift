import SwiftUI

enum FitTheme {
    static let background = Color(red: 0.035, green: 0.045, blue: 0.055)
    static let card = Color(red: 0.075, green: 0.09, blue: 0.105)
    static let cardRaised = Color(red: 0.105, green: 0.12, blue: 0.135)
    static let lime = Color(red: 0.70, green: 0.95, blue: 0.27)
    static let mint = Color(red: 0.27, green: 0.86, blue: 0.68)
    static let blue = Color(red: 0.28, green: 0.67, blue: 1.0)
    static let muted = Color.white.opacity(0.58)
}

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(18)
            .background(FitTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(Color.white.opacity(0.06), lineWidth: 1)
            )
    }
}

extension View {
    func fitCard() -> some View { modifier(CardModifier()) }
}

struct ProgressRing: View {
    let progress: Double
    let value: String
    let caption: String
    var color = FitTheme.lime

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.08), lineWidth: 12)
            Circle()
                .trim(from: 0, to: min(max(progress, 0), 1))
                .stroke(color, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 2) {
                Text(value)
                    .font(.title2.bold())
                Text(caption)
                    .font(.caption)
                    .foregroundStyle(FitTheme.muted)
            }
        }
        .frame(width: 124, height: 124)
    }
}

struct SectionHeader: View {
    let title: String
    var action: String?

    var body: some View {
        HStack {
            Text(title).font(.title3.bold())
            Spacer()
            if let action {
                Text(action)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(FitTheme.lime)
            }
        }
    }
}
