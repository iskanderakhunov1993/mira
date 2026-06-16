import { useMemo, useState } from "react";
import { CheckInModal } from "./components/CheckInModal";
import { BodyScanModal } from "./components/BodyScanModal";
import { FoodScanModal } from "./components/FoodScanModal";
import { MobileNav } from "./components/MobileNav";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { initialExercises } from "./data/demo";
import {
  buildPersonalizedWorkout,
  calculateReadiness,
  getCoachDecision
} from "./lib/coach";
import { NutritionScreen } from "./screens/NutritionScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { TodayScreen } from "./screens/TodayScreen";
import { WorkoutScreen } from "./screens/WorkoutScreen";
import { Onboarding } from "./screens/Onboarding";
import { LandingScreen } from "./screens/LandingScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import type {
  BodyScanResult,
  Exercise,
  ReadinessInput,
  Screen,
  UserProfile
} from "./types";

const replacementExercise = {
  name: "Разгибание бедра с лентой",
  focus: "Ягодицы · комфортная амплитуда",
  prescription: "3 × 12 / сторона",
  rest: "45 сек",
  cue: "Держи корпус стабильным и остановись до появления дискомфорта."
};

const initialProfile: UserProfile = {
  name: "",
  email: "",
  age: 28,
  gender: "Женщина",
  goal: "Подтянуть тело",
  level: "Средний",
  heightCm: 168,
  weightKg: 62,
  weeklyPlan: "3 тренировки в неделю",
  trainingPlace: "Дом + зал",
  availableTime: 32,
  limitations: ["Поясница"],
  cycleTracking: true,
  cycleLength: 28,
  lastPeriodDate: "",
  cycleSymptoms: [],
  optionalDocuments: [],
  wearableSources: []
};

export function App() {
  const [accountCreated, setAccountCreated] = useState(
    () => window.localStorage.getItem("ayla-account-created") === "true"
  );
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => window.localStorage.getItem("ayla-onboarding-complete") === "true"
  );
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = window.localStorage.getItem("ayla-profile");
    return saved
      ? { ...initialProfile, ...(JSON.parse(saved) as UserProfile) }
      : initialProfile;
  });
  const [screen, setScreen] = useState<Screen>("today");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [foodScanOpen, setFoodScanOpen] = useState(false);
  const [bodyScanOpen, setBodyScanOpen] = useState(false);
  const [latestScan, setLatestScan] = useState<BodyScanResult>();
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [checkIn, setCheckIn] = useState<ReadinessInput>({
    sleep: 8,
    energy: 6,
    mood: 7,
    soreness: 4
  });
  const [exercises, setExercises] = useState(initialExercises);
  const [workoutRationale, setWorkoutRationale] = useState(
    "Ayla соберёт план после проверки текущего состояния."
  );
  const [workoutSignals, setWorkoutSignals] = useState<string[]>([
    `Цель: ${profile.goal}`
  ]);
  const [generatedMode, setGeneratedMode] = useState("");
  const [generatedDuration, setGeneratedDuration] = useState(0);

  const readiness = useMemo(() => calculateReadiness(checkIn), [checkIn]);
  const decision = useMemo(
    () => getCoachDecision(readiness),
    [readiness]
  );

  const navigate = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generateWorkout = () => {
    navigate("workout");
    if (generated || generating) return;
    const plan = buildPersonalizedWorkout(profile, latestScan, readiness);
    setExercises(plan.exercises);
    setWorkoutRationale(plan.rationale);
    setWorkoutSignals(plan.signals);
    setGeneratedMode(plan.mode);
    setGeneratedDuration(plan.duration);
    setGenerating(true);
    window.setTimeout(() => {
      setGenerated(true);
      setGenerating(false);
    }, 1600);
  };

  const updateExercise = (
    id: number,
    update: Partial<Pick<Exercise, "completed" | "skipped">>
  ) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === id ? { ...exercise, ...update } : exercise
      )
    );
  };

  const replaceExercise = (id: number) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === id
          ? {
              ...exercise,
              ...replacementExercise,
              completed: false,
              skipped: false
            }
          : exercise
      )
    );
  };

  const completeOnboarding = (
    nextProfile: UserProfile,
    scan?: BodyScanResult
  ) => {
    setProfile(nextProfile);
    setLatestScan(scan);
    setOnboardingComplete(true);
    window.localStorage.setItem("ayla-profile", JSON.stringify(nextProfile));
    window.localStorage.setItem("ayla-onboarding-complete", "true");
  };

  if (!accountCreated) {
    return (
      <LandingScreen
        onCreateAccount={() => {
          setAccountCreated(true);
          window.localStorage.setItem("ayla-account-created", "draft");
        }}
      />
    );
  }

  if (
    accountCreated &&
    window.localStorage.getItem("ayla-account-created") !== "true"
  ) {
    return (
      <RegisterScreen
        profile={profile}
        onBack={() => {
          setAccountCreated(false);
          window.localStorage.removeItem("ayla-account-created");
        }}
        onChange={setProfile}
        onComplete={() => {
          window.localStorage.setItem("ayla-account-created", "true");
          window.localStorage.setItem("ayla-profile", JSON.stringify(profile));
          setProfile({ ...profile });
        }}
      />
    );
  }

  if (!onboardingComplete) {
    return (
      <Onboarding
        initialProfile={profile}
        onComplete={completeOnboarding}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active={screen} onNavigate={navigate} />
      <div className="app-main">
        <TopBar />
        <main>
          {screen === "today" && (
            <TodayScreen
              readiness={readiness}
              insight={decision.insight}
              workoutMode={decision.mode}
              workoutDuration={decision.duration}
              onCheckIn={() => setCheckInOpen(true)}
              onGenerate={generateWorkout}
              onNutrition={() => setFoodScanOpen(true)}
            />
          )}
          {screen === "workout" && (
            <WorkoutScreen
              exercises={exercises}
              generated={generated}
              generating={generating}
              workoutMode={generatedMode || decision.mode}
              workoutDuration={generatedDuration || decision.duration}
              rationale={workoutRationale}
              signals={
                workoutSignals.length > 1
                  ? workoutSignals
                  : [
                      `Цель: ${profile.goal}`,
                      `Готовность ${readiness}`,
                      latestScan ? "Body scan готов" : "Без body scan"
                    ]
              }
              hasBodyScan={Boolean(latestScan)}
              onGenerate={generateWorkout}
              onUpdateExercise={updateExercise}
              onReplace={replaceExercise}
              onBodyCheck={() => setBodyScanOpen(true)}
              onBack={() => navigate("today")}
            />
          )}
          {screen === "nutrition" && (
            <NutritionScreen onAddMeal={() => setFoodScanOpen(true)} />
          )}
          {screen === "progress" && (
            <ProgressScreen
              latestScan={latestScan}
              onNewScan={() => setBodyScanOpen(true)}
            />
          )}
          {screen === "profile" && (
            <ProfileScreen
              profile={profile}
              onRestartOnboarding={() => {
                window.localStorage.removeItem("ayla-onboarding-complete");
                setOnboardingComplete(false);
                setScreen("today");
              }}
            />
          )}
        </main>
      </div>
      <MobileNav active={screen} onNavigate={navigate} />

      {checkInOpen && (
        <CheckInModal
          initial={checkIn}
          onClose={() => setCheckInOpen(false)}
          onSave={(value) => {
            setCheckIn(value);
            setCheckInOpen(false);
            setGenerated(false);
          }}
        />
      )}
      {foodScanOpen && (
        <FoodScanModal onClose={() => setFoodScanOpen(false)} />
      )}
      {bodyScanOpen && (
        <BodyScanModal
          profile={profile}
          previousScan={latestScan}
          onClose={() => setBodyScanOpen(false)}
          onComplete={(result) => {
            setLatestScan(result);
            setGenerated(false);
            setBodyScanOpen(false);
            navigate("workout");
          }}
        />
      )}
    </div>
  );
}
