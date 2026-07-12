"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Tab = "today" | "progress" | "rewards" | "club" | "profile";
type OnboardingStep = "intro" | "form";
type Mission = {
  id: string;
  title: string;
  description: string;
  points: number;
  category?: string;
  is_active?: boolean;
};

const brandRed = "#E30613";

const demoMissions: Mission[] = [];

const levels = [
  { name: "Гость", min: 0 },
  { name: "Резидент", min: 100 },
  { name: "Инсайдер", min: 400 },
  { name: "Личный круг", min: 900 },
];

const rewards = [
  {
    level: "Гость",
    title: "Доступ к клубным миссиям",
    description: "Можно выполнять миссии, копить баллы и открывать уровни.",
    unlocked: true,
  },
  {
    level: "Резидент",
    title: "Лист ожидания",
    description: "Приоритетное уведомление об освободившихся окнах.",
    unlocked: false,
  },
  {
    level: "Инсайдер",
    title: "Закрытые слоты",
    description: "Доступ к отдельным окнам для участников клуба.",
    unlocked: false,
  },
  {
    level: "Личный круг",
    title: "Персональный бонус месяца",
    description: "Клубный апгрейд или доступ к закрытому wellness-формату.",
    unlocked: false,
  },
];

const goals = ["Восстановление", "Расслабление", "Тонус", "Снять напряжение"];
const reminderTimes = ["Утро", "День", "Вечер"];

const interestOptions = [
  "Массаж",
  "Хаммам",
  "Уход",
  "Антистресс",
  "Тонус",
  "Закрытые форматы",
];
const demoSpecialist = {
  name: "Анна Морозова",
  role: "Специалист по восстановлению",
  direction: "Массаж · хаммам · антистресс",
  recommendation: "Курс 5 процедур, следующий визит через 7–10 дней.",
};

const demoUpcomingVisit = {
  date: "28 июня",
  time: "16:00",
  service: "Хаммам",
  specialist: "Анна Морозова",
  status: "Запланирован",
};

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("intro");
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const [goal, setGoal] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [visitConfirmed, setVisitConfirmed] = useState(false);
  const [visitsCount, setVisitsCount] = useState(0);
  const [missions, setMissions] = useState<Mission[]>(demoMissions);

  const [rewards, setRewards] = useState<any[]>([]); 

  const [basePoints, setBasePoints] = useState(0);

  const [streakCount, setStreakCount] = useState(0);

  const [telegramId, setTelegramId] = useState("");
  const [telegramName, setTelegramName] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  console.log("TELEGRAM USER:", telegramId, telegramName);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;

    console.log("TG:", tg);
    console.log("USER:", tg?.initDataUnsafe?.user);

if (tg?.initDataUnsafe?.user) {
  setTelegramId(String(tg.initDataUnsafe.user.id));
  setTelegramName(tg.initDataUnsafe.user.first_name);
}
  loadMissions();
  loadRewards();
}, []);

useEffect(() => {
  if (!telegramId) return;

  loadCurrentUser();
}, [telegramId, telegramName]);

  useEffect(() => {
  if (!currentUserId) return;

  loadCompletedMissions();
  loadConfirmedVisit();
}, [currentUserId]);

async function loadMissions() {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("is_active", true)
    .limit(3);

  if (error) {
    console.error(error);
    return;
  }

  setMissions(data ?? []);

}

async function loadRewards() {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error(error);
    return;
  }

  setRewards(data ?? []);
}

async function loadCurrentUser() {

  console.log("Ищем пользователя:", telegramId, telegramName);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return;
  }

if (!data && telegramId) {
  const { data: newUser, error: createError } = await supabase
    .from("users")
    .insert({
      telegram_id: telegramId,
      name: telegramName,
      points_balance: 0,
    })
    .select()
    .single();

    if (createError) {
  console.error("Ошибка создания пользователя:", createError);
  return;
}

  if (newUser) {
  setCurrentUserId(newUser.id);
  setBasePoints(0);
  setStreakCount(0);
  setIsOnboardingComplete(false);
  setOnboardingStep("intro");
}

  return;
}

  if (data) {
  setCurrentUserId(data.id);
  setGoal(data.goal ?? "");
  setReminderTime(data.reminder_time ?? "");
  setBasePoints(data.points_balance ?? 0);
  setStreakCount(data.streak_count ?? 0);
  setSelectedInterests(
    data.interests ? data.interests.split(",") : []
  );
  const hasCompletedProfile =
  Boolean(data.goal) &&
  Boolean(data.reminder_time) &&
  Boolean(data.interests);

setIsOnboardingComplete(hasCompletedProfile);

if (hasCompletedProfile) {
  setActiveTab("today");
} else {
  setOnboardingStep("intro");
}
}
}
async function loadCompletedMissions() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("user_missions")
    .select("mission_id")
    .eq("user_id", currentUserId)
    .eq("status", "completed")
    .gte("completed_at", startOfDay.toISOString());

  if (error) {
    console.error(error);
    return;
  }

  setCompletedMissions(
  Array.from(new Set(data?.map((item) => item.mission_id) ?? []))
);
}
  const visitPoints = visitConfirmed ? 100 : 0;

  const earnedPoints = completedMissions.reduce((sum, missionId) => {
    const mission = missions.find((item) => item.id === missionId);
    return sum + (mission?.points ?? 0);
  }, 0);

  const totalPoints = basePoints;

  const currentLevel = useMemo(() => {
    const availableLevels = levels.filter((level) => totalPoints >= level.min);
    return availableLevels[availableLevels.length - 1];
  }, [totalPoints]);

  const nextLevel = levels.find((level) => level.min > totalPoints);

  const pointsToNextLevel = nextLevel
  ? Math.max(0, nextLevel.min - totalPoints)
  : 0;

async function loadConfirmedVisit() {
  if (!currentUserId) return;

  const { data, error } = await supabase
    .from("visits")
    .select("id")
    .eq("user_id", currentUserId)
    .eq("status", "confirmed")
    .eq("points_awarded", true);

  if (error) {
    console.error("Ошибка загрузки визитов:", error);
    return;
  }

  setVisitConfirmed((data?.length ?? 0) > 0);
  setVisitsCount(data?.length ?? 0);
}

  const progressPercent = useMemo(() => {
    if (!nextLevel) return 100;

    const start = currentLevel.min;
    const end = nextLevel.min;
    const progress = ((totalPoints - start) / (end - start)) * 100;

    return Math.min(100, Math.max(0, Math.round(progress)));
  }, [currentLevel.min, nextLevel, totalPoints]);

  const completeMission = async (missionId: string) => {
  if (completedMissions.includes(missionId)) return;

  if (!currentUserId) return;

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const { data: todayTransactions, error: todayError } = await supabase
  .from("points_transactions")
  .select("amount")
  .eq("user_id", currentUserId)
  .eq("type", "mission")
  .gte("created_at", startOfDay.toISOString());

if (todayError) {
  console.error(todayError);
  alert("Не удалось проверить дневной лимит");
  return;
}

const todayMissionPoints =
  todayTransactions?.reduce(
    (sum, transaction) => sum + Number(transaction.amount ?? 0),
    0
  ) ?? 0;

  const mission = missions.find((item) => item.id === missionId);
  const missionPoints = mission?.points ?? 0;


if (todayMissionPoints + missionPoints > 30) {
  alert("Дневной лимит — 30 баллов за миссии");
  return;
}

 const pointsToAdd = missionPoints;

  const { error } = await supabase
    .from("user_missions")
    .insert({
      user_id: currentUserId,
      mission_id: missionId,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

  if (error) {
  console.error(error);
  alert("Ошибка сохранения миссии");
  return;
}

await supabase
  .from("points_transactions")
  .insert({
    user_id: currentUserId,
    type: "mission",
    amount: pointsToAdd,
    source: mission?.title ?? "Миссия",
    source_id: missionId,
  });

const { data: updatedUser, error: updateUserError } = await supabase
  .from("users")
  .update({
    points_balance: totalPoints + pointsToAdd,
  })
  .eq("id", currentUserId)
  .select();
if (updateUserError) {
  console.error(updateUserError);
  alert("Ошибка начисления баллов");
  return;
}

const today = new Date();
const yesterday = new Date();

yesterday.setDate(today.getDate() - 1);

const todayString = getLocalDateString(today);
const yesterdayString = getLocalDateString(yesterday);

const { data: streakUser, error: streakLoadError } = await supabase
  .from("users")
  .select("streak_count, last_active_date")
  .eq("id", currentUserId)
  .single();

if (streakLoadError) {
  console.error("Ошибка загрузки стрика:", streakLoadError);
} else if (streakUser.last_active_date !== todayString) {
  const newStreakCount =
    streakUser.last_active_date === yesterdayString
      ? Number(streakUser.streak_count ?? 0) + 1
      : 1;

  const { error: streakUpdateError } = await supabase
    .from("users")
    .update({
      streak_count: newStreakCount,
      last_active_date: todayString,
    })
    .eq("id", currentUserId);

  if (streakUpdateError) {
    console.error("Ошибка обновления стрика:", streakUpdateError);
  } else {
    setStreakCount(newStreakCount);
  }
}

setBasePoints(totalPoints + pointsToAdd);

setCompletedMissions([...completedMissions, missionId]);
};

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        return current.filter((item) => item !== interest);
      }

      return [...current, interest];
    });
  };

  const completeOnboarding = async () => {
  if (!currentUserId) return; 
  if (!goal || !reminderTime || selectedInterests.length === 0) return;

  const { data, error } = await supabase
    .from("users")
    .update({
  goal: goal,
  reminder_time: reminderTime,
  interests: selectedInterests.join(","),
})
.eq("id", currentUserId)
.select()
.single();

  if (error) {
    alert("Ошибка сохранения пользователя");
    return;
  }

  setIsOnboardingComplete(true);
  setActiveTab("today");
};

  const openSupport = () => {
    alert(
      "В боевой версии здесь откроется Telegram-бот: быстрые вопросы, запись, баллы, привилегии и подключение администратора."
    );
  };

  if (!isOnboardingComplete) {
    return (
      <main className="min-h-screen bg-[#0E0E0E] text-white">
        <section className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-7">
          {onboardingStep === "intro" && (
            <IntroScreen onStart={() => setOnboardingStep("form")} />
          )}

          {onboardingStep === "form" && (
            <OnboardingForm
              goal={goal}
              reminderTime={reminderTime}
              selectedInterests={selectedInterests}
              onGoalChange={setGoal}
              onReminderTimeChange={setReminderTime}
              onToggleInterest={toggleInterest}
              onBack={() => setOnboardingStep("intro")}
              onComplete={completeOnboarding}
            />
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0E0E0E] text-white">
      <section className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-24 pt-7">
        <Header
         totalPoints={totalPoints}
         currentLevel={currentLevel.name}
         telegramName={telegramName}
         streakCount={streakCount}
/>

        {activeTab === "today" && (
          <TodayScreen missions={missions} 
            totalPoints={totalPoints}
            currentLevel={currentLevel.name}
            nextLevel={nextLevel?.name}
            progressPercent={progressPercent}
            completedMissions={completedMissions}
            onCompleteMission={completeMission}
            goal={goal}
            selectedInterests={selectedInterests}
          />
        )}

        {activeTab === "progress" && (
          <ProgressScreen
            totalPoints={totalPoints}
            currentLevel={currentLevel.name}
            nextLevel={nextLevel?.name}
            progressPercent={progressPercent}
            completedMissionsCount={completedMissions.length}
            visitConfirmed={visitConfirmed}
            streakCount={streakCount}
            pointsToNextLevel={pointsToNextLevel}
            visitsCount={visitsCount}
          />
        )}

        {activeTab === "rewards" && (
  <RewardsScreen
    rewards={rewards}
    totalPoints={totalPoints}
  />
)}

        {activeTab === "club" && (
          <ClubScreen
  visitConfirmed={visitConfirmed}
/>
        )}

        {activeTab === "profile" && (
          <ProfileScreen
            goal={goal}
            reminderTime={reminderTime}
            selectedInterests={selectedInterests}
            visitConfirmed={visitConfirmed}
            onSupport={openSupport}
            onResetOnboarding={() => {
              setIsOnboardingComplete(false);
              setOnboardingStep("form");
            }}
          />
        )}
      </section>

      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
    </main>
  );
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mb-8">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-neutral-300">
          Клуб Личное тело
        </div>

        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight">
          Добро пожаловать в клуб “Личного тела”
        </h1>

        <p className="mt-4 text-lg leading-7 text-neutral-300">
          Персональные рекомендации, баллы за активность и специальные
          предложения для участников клуба.
        </p>
      </div>

      <div className="grid gap-3">
        <FeatureCard
          title="Приветственный бонус"
          text="+50 баллов после вступления в клуб"
        />

        <FeatureCard
          title="Предложение месяца"
          text="Специальное условие для участников клуба после первого визита"
        />

        <FeatureCard
          title="Что внутри клуба"
          text="Ежедневные миссии, баллы, уровни и привилегии Личного тела"
        />
      </div>

      <div className="mt-auto pb-4 pt-10">
        <button
          onClick={onStart}
          className="w-full rounded-3xl px-5 py-5 text-base font-semibold text-white"
          style={{ backgroundColor: brandRed }}
        >
          Вступить в клуб
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
          Первый шаг — короткая настройка профиля. Это займёт меньше минуты.
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-neutral-400">{text}</p>
    </div>
  );
}

function OnboardingForm({
  goal,
  reminderTime,
  selectedInterests,
  onGoalChange,
  onReminderTimeChange,
  onToggleInterest,
  onBack,
  onComplete,
}: {
  goal: string;
  reminderTime: string;
  selectedInterests: string[];
  onGoalChange: (value: string) => void;
  onReminderTimeChange: (value: string) => void;
  onToggleInterest: (value: string) => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  const isReady = Boolean(
    goal && reminderTime && selectedInterests.length > 0
  );

  return (
    <div className="flex min-h-screen flex-col">
      <button onClick={onBack} className="mb-6 w-fit text-sm text-neutral-400">
        ← Назад
      </button>

      <div>
        <p className="text-sm text-neutral-400">Первый вход</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Настроим клуб под вас
        </h1>
        <p className="mt-3 text-base leading-6 text-neutral-300">
          Три быстрых вопроса, чтобы в демо показать персональный путь клиента.
        </p>
      </div>

      <div className="mt-8 grid gap-7">
        <ChoiceBlock
          title="Какая цель ближе?"
          options={goals}
          value={goal}
          onChange={onGoalChange}
        />

        <ChoiceBlock
          title="Когда удобнее получать напоминания?"
          options={reminderTimes}
          value={reminderTime}
          onChange={onReminderTimeChange}
        />

        <MultiChoiceBlock
          title="Что интереснее всего?"
          subtitle="Можно выбрать несколько вариантов."
          options={interestOptions}
          values={selectedInterests}
          onToggle={onToggleInterest}
        />
      </div>

      <div className="mt-auto pb-4 pt-10">
        <button
          onClick={onComplete}
          disabled={!isReady}
          className={
            isReady
              ? "w-full rounded-3xl px-5 py-5 text-base font-semibold text-white"
              : "w-full rounded-3xl bg-white/10 px-5 py-5 text-base font-semibold text-neutral-500"
          }
          style={isReady ? { backgroundColor: brandRed } : undefined}
        >
          Перейти в клуб
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
          В рабочей версии ответы сохраняются в профиле клиента.
        </p>
      </div>
    </div>
  );
}

function ChoiceBlock({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = value === option;

          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={
                isSelected
                  ? "rounded-2xl px-4 py-4 text-left text-sm font-semibold text-white"
                  : "rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left text-sm text-neutral-300"
              }
              style={isSelected ? { backgroundColor: brandRed } : undefined}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MultiChoiceBlock({
  title,
  subtitle,
  options,
  values,
  onToggle,
}: {
  title: string;
  subtitle: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = values.includes(option);

          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={
                isSelected
                  ? "rounded-2xl px-4 py-4 text-left text-sm font-semibold text-white"
                  : "rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left text-sm text-neutral-300"
              }
              style={isSelected ? { backgroundColor: brandRed } : undefined}
            >
              {isSelected ? "✓ " : ""}
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Header({
  totalPoints,
  currentLevel,
  telegramName,
  streakCount,
}: {
  totalPoints: number;
  currentLevel: string;
  telegramName: string;
  streakCount: number;
}) {
  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">Клуб восстановления</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            Личное тело
          </h1>
        </div>
{telegramName && (
  <p className="mt-2 text-sm text-neutral-400">
    Привет, {telegramName}
  </p>
)}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-4">
       
       <div className="text-center">
        <p className="text-xs text-neutral-400">Стрик</p>
        <p className="text-lg font-semibold">🔥 {streakCount}</p>
       </div>
       
        <div>
          <p className="text-sm text-neutral-400">Ваш статус</p>
          <p className="text-xl font-semibold">{currentLevel}</p>
        </div>

        <div className="rounded-2xl bg-white px-4 py-2 text-black">
          <p className="text-xs text-neutral-500">Баллы</p>
          <p className="text-lg font-semibold">{totalPoints}</p>
        </div>
      </div>
    </header>
  );
}

function TodayScreen({
  missions,
  totalPoints,
  currentLevel,
  nextLevel,
  progressPercent,
  completedMissions,
  onCompleteMission,
  goal,
  selectedInterests,
}: {
  missions: Mission[];
  totalPoints: number;
  currentLevel: string;
  nextLevel?: string;
  progressPercent: number;
  completedMissions: string[];
  onCompleteMission: (missionId: string) => void;
  goal: string;
  selectedInterests: string[];
}) {
  return (
    <div>
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Сегодня</p>
        <h2 className="mt-1 text-2xl font-semibold">3 миссии готовы</h2>
        <p className="mt-2 text-sm leading-5 text-neutral-300">
          Цель клиента: {goal || "восстановление"}. Интересы:{" "}
          {selectedInterests.length > 0
            ? selectedInterests.join(", ")
            : "не выбраны"}
          .
        </p>

        <div className="mt-5">
          <div className="flex justify-between text-sm text-neutral-400">
            <span>{currentLevel}</span>
            <span>{nextLevel ? `до ${nextLevel}` : "максимальный уровень"}</span>
          </div>

          <div className="mt-2 h-3 rounded-full bg-white/10">
            <div
              className="h-3 rounded-full"
              style={{ width: `${progressPercent}%`, backgroundColor: brandRed }}
            />
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            {totalPoints} баллов · прогресс {progressPercent}%
          </p>
        </div>
      </section>

      <section className="mt-5 grid gap-3">
        {missions.map((mission) => {
          const isCompleted = completedMissions.includes(mission.id);
          

          return (
            <div
              key={mission.id}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{mission.title}</p>
                  <p className="mt-1 text-sm leading-5 text-neutral-400">
                    {mission.description}
                  </p>
                  <p className="mt-3 text-sm text-neutral-300">
                    +{mission.points} баллов
                  </p>
                </div>

                <button
                  onClick={() => onCompleteMission(mission.id)}
                  disabled={isCompleted}
                  className={
                    isCompleted
                      ? "rounded-2xl bg-white/10 px-4 py-2 text-sm text-neutral-400"
                      : "rounded-2xl px-4 py-2 text-sm font-semibold text-white"
                  }
                  style={!isCompleted ? { backgroundColor: brandRed } : undefined}
                >
                  {isCompleted ? "Готово" : "Сделано"}
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function ProgressScreen({
  totalPoints,
  currentLevel,
  nextLevel,
  progressPercent,
  completedMissionsCount,
  visitConfirmed,
  streakCount,
  pointsToNextLevel,
  visitsCount,
}: {
  totalPoints: number;
  currentLevel: string;
  nextLevel?: string;
  progressPercent: number;
  completedMissionsCount: number;
  visitConfirmed: boolean;
  streakCount: number;
  pointsToNextLevel: number;
  visitsCount: number;
}) {
  return (
    <div>
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Ваш прогресс</p>
        <h2 className="mt-1 text-3xl font-semibold">{totalPoints} баллов</h2>
        <p className="mt-2 text-sm text-neutral-300">
          Текущий уровень: {currentLevel}
        </p>

        <div className="mt-5 h-3 rounded-full bg-white/10">
          <div
            className="h-3 rounded-full"
            style={{ width: `${progressPercent}%`, backgroundColor: brandRed }}
          />
        </div>

        <p className="mt-2 text-sm text-neutral-400">
          {nextLevel
            ? `До уровня “${nextLevel}” осталось ${pointsToNextLevel} баллов.`
            : "Вы открыли максимальный уровень."}
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard
           label="Ритм"
           value={`${streakCount} ${streakCount === 1 ? "день" : "дней"} подряд`}
/>
        <StatCard label="Миссии" value={`${completedMissionsCount}/3`} />
        <StatCard label="Визиты" value={String(visitsCount)} />
        <StatCard label="Привилегии" value="1 доступна" />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RewardsScreen({
  rewards,
  totalPoints,
}: {
  rewards: any[];
  totalPoints: number;
}) {
  return (
    <div>
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Привилегии</p>
        <h2 className="mt-1 text-2xl font-semibold">Не скидки, а статус</h2>
        <p className="mt-2 text-sm leading-5 text-neutral-300">
          Баллы открывают сервисные преимущества: лист ожидания, закрытые слоты,
          апгрейды и клубные форматы.
        </p>
      </section>

      <section className="mt-5 grid gap-3">
        {rewards.map((reward) => (
          <div
            key={reward.title}
            className={
              totalPoints >= reward.cost_points
                ? "rounded-3xl bg-white p-4 text-black"
                : "rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-white"
            }
          >
            <p
              className={
                totalPoints >= reward.cost_points
                  ? "text-sm text-neutral-500"
                  : "text-sm text-neutral-400"
              }
            >
              {reward.cost_points} баллов
            </p>
            <h3 className="mt-1 text-lg font-semibold">{reward.title}</h3>
            <p
              className={
                totalPoints >= reward.cost_points
                  ? "mt-2 text-sm leading-5 text-neutral-600"
                  : "mt-2 text-sm leading-5 text-neutral-400"
              }
            >
              {reward.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

function ClubScreen({
  visitConfirmed,
}: {
  visitConfirmed: boolean;
}) {
  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Клуб</p>
        <h2 className="mt-1 text-2xl font-semibold">Как растут баллы</h2>
        <p className="mt-2 text-sm leading-5 text-neutral-300">
          Клиент не просто получает скидку. Он возвращается в клуб, выполняет
          маленькие действия, приходит на процедуры и постепенно открывает
          привилегии.
        </p>
      </section>

      <section className="grid gap-3">
        <PointRule
          title="Ежедневные миссии"
          text="Короткие wellness-действия между визитами."
          points="+5 / +10"
        />
        <PointRule
         title="Подтверждённый визит"
         text="После подтверждения посещения в 1С баллы начисляются автоматически."
         points="+100"
/>
        <PointRule
          title="Клубные форматы"
          text="Закрытые события, спецпредложения и активности можно добавить позже."
          points="+150"
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Предложения и сообщения</p>
        <h2 className="mt-1 text-2xl font-semibold">
          Индивидуально или группе
        </h2>
        <p className="mt-2 text-sm leading-5 text-neutral-300">
          В рабочей версии персональные предложения будут формироваться автоматически на основе истории посещений, интересов клиента и данных из 1С.
        </p>

        <div className="mt-4 grid gap-3">
          <OfferCard
            title="Индивидуальное предложение"
            text="Например: персональная рекомендация от специалиста после визита."
          />
          <OfferCard
            title="Группа клиентов"
            text="Например: всем, кто выбрал хаммам, давно не был или достиг уровня “Резидент”."
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-400">Подтверждение визита</p>
            <h3 className="mt-1 text-xl font-semibold">
              {visitConfirmed
                ? "Визит подтверждён"
                : "Визит ожидает подтверждения"}
            </h3>
            <p className="mt-2 text-sm leading-5 text-neutral-400">
              {visitConfirmed
                ? "Начислено +100 баллов. В полной версии клиент получит уведомление в Telegram."
                : "После подтверждения посещения в 1С баллы начислятся автоматически и появятся в Telegram."}
            </p>
          </div>

          <div
            className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white"
            style={{ backgroundColor: visitConfirmed ? brandRed :"#333333" }}
          >
            +100
          </div>
        </div>

      </section>
    </div>
  );
}

function PointRule({
  title,
  text,
  points,
}: {
  title: string;
  text: string;
  points: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-neutral-400">{text}</p>
      </div>

      <div
        className="shrink-0 rounded-2xl px-3 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: brandRed }}
      >
        {points}
      </div>
    </div>
  );
}

function OfferCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-black/25 p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-neutral-400">{text}</p>
    </div>
  );
}

function ProfileScreen({
  goal,
  reminderTime,
  selectedInterests,
  visitConfirmed,
  onSupport,
  onResetOnboarding,
}: {
  goal: string;
  reminderTime: string;
  selectedInterests: string[];
  visitConfirmed: boolean;
  onSupport: () => void;
  onResetOnboarding: () => void;
}) {
  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Профиль</p>
        <h2 className="mt-1 text-2xl font-semibold">Наташа</h2>
        <p className="mt-2 text-sm text-neutral-300">
          Демо-клиент клуба “Личное тело”
        </p>
      </section>

      <SpecialistCard />

      <VisitsBlock visitConfirmed={visitConfirmed} />

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <h3 className="text-xl font-semibold">Настройки</h3>

        <div className="mt-4 grid gap-3 text-sm">
          <ProfileRow label="Цель" value={goal || "Не выбрано"} />
          <ProfileRow label="Напоминания" value={reminderTime || "Не выбрано"} />
          <ProfileRow
            label="Интересы"
            value={
              selectedInterests.length > 0
                ? selectedInterests.join(", ")
                : "Не выбрано"
            }
          />
        </div>
      </section>

      <button
        onClick={onSupport}
        className="rounded-3xl px-5 py-4 text-left font-semibold text-white"
        style={{ backgroundColor: brandRed }}
      >
        Связаться с админом
      </button>

      <button
        onClick={onResetOnboarding}
        className="rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-4 text-left text-sm text-neutral-300"
      >
        Изменить анкету
      </button>
    </div>
  );
}

function SpecialistCard() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-neutral-400">Ваш специалист</p>

      <div className="mt-4 flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white"
          style={{ backgroundColor: brandRed }}
        >
          А
        </div>

        <div>
          <h3 className="text-xl font-semibold">{demoSpecialist.name}</h3>
          <p className="mt-1 text-sm text-neutral-400">{demoSpecialist.role}</p>
          <p className="mt-1 text-sm text-neutral-300">
            {demoSpecialist.direction}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-black/25 p-4">
        <p className="text-sm text-neutral-400">Рекомендация</p>
        <p className="mt-1 text-sm leading-5 text-neutral-300">
          {demoSpecialist.recommendation}
        </p>
      </div>

      <p className="mt-3 text-xs leading-5 text-neutral-500">
        В рабочей версии специалист и рекомендации могут подтягиваться из 1С или
        заполняться администратором.
      </p>
    </section>
  );
}

function VisitsBlock({ visitConfirmed }: { visitConfirmed: boolean }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-neutral-400">Мои визиты</p>
      <h3 className="mt-1 text-xl font-semibold">Ближайший визит</h3>

      <div className="mt-4 rounded-2xl bg-black/25 p-4">
        <div className="flex justify-between gap-4">
          <div>
            <p className="font-semibold">
              {demoUpcomingVisit.date}, {demoUpcomingVisit.time}
            </p>
            <p className="mt-1 text-sm text-neutral-300">
              {demoUpcomingVisit.service}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              Специалист: {demoUpcomingVisit.specialist}
            </p>
          </div>

          <div className="h-fit rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-300">
            {demoUpcomingVisit.status}
          </div>
        </div>
      </div>

      <h3 className="mt-5 text-xl font-semibold">История визитов</h3>

      {visitConfirmed ? (
        <div className="mt-3 rounded-2xl bg-black/25 p-4">
          <div className="flex justify-between gap-4">
            <div>
              <p className="font-semibold">Сегодня</p>
              <p className="mt-1 text-sm text-neutral-300">
                Визит подтверждён
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                Начисление за посещение
              </p>
            </div>

            <div
              className="h-fit rounded-2xl px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: brandRed }}
            >
              +100
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-black/25 p-4">
          <p className="text-sm leading-5 text-neutral-400">
            История появится после подтверждения визита. В рабочей версии данные
            могут подтягиваться из 1С.
          </p>
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-neutral-500">
        Для синхронизации с 1С нужно получить данные по клиентам, записям,
        специалистам и статусам визитов.
      </p>
    </section>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-neutral-400">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function BottomNavigation({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "today", label: "Сегодня" },
    { id: "progress", label: "Прогресс" },
    { id: "rewards", label: "Привилегии" },
    { id: "club", label: "Клуб" },
    { id: "profile", label: "Профиль" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#151515]/95 px-3 pb-5 pt-3 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={
                isActive
                  ? "rounded-2xl px-2 py-3 text-xs font-semibold text-white"
                  : "rounded-2xl px-2 py-3 text-xs text-neutral-400"
              }
              style={isActive ? { backgroundColor: brandRed } : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}