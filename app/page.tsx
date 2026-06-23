"use client";

import { useMemo, useState } from "react";

type Tab = "today" | "progress" | "rewards" | "visits" | "profile";
type OnboardingStep = "intro" | "form";

const brandRed = "#E30613";

const missions = [
  {
    id: 1,
    title: "2 минуты тишины",
    description: "Отложите телефон и побудьте в тишине без задач и уведомлений.",
    points: 10,
  },
  {
    id: 2,
    title: "Расслабить плечи",
    description: "Сделайте 5 медленных кругов плечами и отпустите напряжение.",
    points: 10,
  },
  {
    id: 3,
    title: "Стакан воды",
    description: "Выпейте стакан воды до кофе, сладкого или нового дела.",
    points: 5,
  },
];

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
const interests = ["Процедуры", "Уход", "Ритуалы", "Закрытые форматы"];

export default function Home() {
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("intro");
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const [goal, setGoal] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [interest, setInterest] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [visitConfirmed, setVisitConfirmed] = useState(false);

  const basePoints = 80;
  const visitPoints = visitConfirmed ? 100 : 0;

  const earnedPoints = completedMissions.reduce((sum, missionId) => {
    const mission = missions.find((item) => item.id === missionId);
    return sum + (mission?.points ?? 0);
  }, 0);

  const totalPoints = basePoints + earnedPoints + visitPoints;

  const currentLevel = useMemo(() => {
    const availableLevels = levels.filter((level) => totalPoints >= level.min);
    return availableLevels[availableLevels.length - 1];
  }, [totalPoints]);

  const nextLevel = levels.find((level) => level.min > totalPoints);

  const progressPercent = useMemo(() => {
    if (!nextLevel) return 100;

    const start = currentLevel.min;
    const end = nextLevel.min;
    const progress = ((totalPoints - start) / (end - start)) * 100;

    return Math.min(100, Math.max(0, Math.round(progress)));
  }, [currentLevel.min, nextLevel, totalPoints]);

  const completeMission = (missionId: number) => {
    if (completedMissions.includes(missionId)) return;
    setCompletedMissions([...completedMissions, missionId]);
  };

  const confirmVisitDemo = () => {
    if (visitConfirmed) return;
    setVisitConfirmed(true);
  };

  const completeOnboarding = () => {
    if (!goal || !reminderTime || !interest) return;
    setIsOnboardingComplete(true);
    setActiveTab("today");
  };

  const openSupport = () => {
    alert(
      "В боевой версии здесь откроется Telegram-бот: сначала быстрые вопросы, затем подключение администратора."
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
              interest={interest}
              onGoalChange={setGoal}
              onReminderTimeChange={setReminderTime}
              onInterestChange={setInterest}
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
        <Header totalPoints={totalPoints} currentLevel={currentLevel.name} />

        {activeTab === "today" && (
          <TodayScreen
            totalPoints={totalPoints}
            currentLevel={currentLevel.name}
            nextLevel={nextLevel?.name}
            progressPercent={progressPercent}
            completedMissions={completedMissions}
            onCompleteMission={completeMission}
            goal={goal}
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
          />
        )}

        {activeTab === "rewards" && <RewardsScreen />}

        {activeTab === "visits" && (
          <VisitsScreen
            visitConfirmed={visitConfirmed}
            onConfirmVisit={confirmVisitDemo}
          />
        )}

        {activeTab === "profile" && (
          <ProfileScreen
            goal={goal}
            reminderTime={reminderTime}
            interest={interest}
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
      <div className="mb-10">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-neutral-300">
          Telegram Mini App · демо-прототип
        </div>

        <h1 className="mt-6 text-5xl font-semibold tracking-tight">
          Личное тело
        </h1>

        <p className="mt-4 text-lg leading-7 text-neutral-300">
          Клуб восстановления, где ежедневные ритуалы и визиты превращаются в
          баллы, уровни и клубные привилегии.
        </p>
      </div>

      <div className="grid gap-3">
        <FeatureCard
          title="Миссии"
          text="Короткие действия, которые удерживают контакт с клиентом между визитами."
        />
        <FeatureCard
          title="Баллы и уровни"
          text="Клиент видит прогресс и открывает статус внутри клуба."
        />
        <FeatureCard
          title="Визиты"
          text="После подтверждённого визита баллы начисляются автоматически или через администратора."
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
          Это демонстрационная версия. Данные пока не сохраняются в базе.
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
  interest,
  onGoalChange,
  onReminderTimeChange,
  onInterestChange,
  onBack,
  onComplete,
}: {
  goal: string;
  reminderTime: string;
  interest: string;
  onGoalChange: (value: string) => void;
  onReminderTimeChange: (value: string) => void;
  onInterestChange: (value: string) => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  const isReady = Boolean(goal && reminderTime && interest);

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

        <ChoiceBlock
          title="Что интереснее всего?"
          options={interests}
          value={interest}
          onChange={onInterestChange}
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

function Header({
  totalPoints,
  currentLevel,
}: {
  totalPoints: number;
  currentLevel: string;
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

        <div
          className="rounded-full px-3 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: brandRed }}
        >
          демо
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-4">
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
  totalPoints,
  currentLevel,
  nextLevel,
  progressPercent,
  completedMissions,
  onCompleteMission,
  goal,
}: {
  totalPoints: number;
  currentLevel: string;
  nextLevel?: string;
  progressPercent: number;
  completedMissions: number[];
  onCompleteMission: (missionId: number) => void;
  goal: string;
}) {
  return (
    <div>
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Сегодня</p>
        <h2 className="mt-1 text-2xl font-semibold">3 миссии готовы</h2>
        <p className="mt-2 text-sm leading-5 text-neutral-300">
          Цель клиента: {goal || "восстановление"}. Миссии дают лёгкое касание
          между визитами и вовлекают в клуб.
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
}: {
  totalPoints: number;
  currentLevel: string;
  nextLevel?: string;
  progressPercent: number;
  completedMissionsCount: number;
  visitConfirmed: boolean;
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
            ? `До уровня “${nextLevel}” осталось немного.`
            : "Вы открыли максимальный уровень демо-версии."}
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard label="Ритм" value="3 дня подряд" />
        <StatCard label="Миссии" value={`${completedMissionsCount}/3`} />
        <StatCard label="Визиты" value={visitConfirmed ? "1" : "0"} />
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

function RewardsScreen() {
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
              reward.unlocked
                ? "rounded-3xl bg-white p-4 text-black"
                : "rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-white"
            }
          >
            <p
              className={
                reward.unlocked
                  ? "text-sm text-neutral-500"
                  : "text-sm text-neutral-400"
              }
            >
              {reward.level}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{reward.title}</h3>
            <p
              className={
                reward.unlocked
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

function VisitsScreen({
  visitConfirmed,
  onConfirmVisit,
}: {
  visitConfirmed: boolean;
  onConfirmVisit: () => void;
}) {
  return (
    <div className="grid gap-4">
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Визиты</p>
        <h2 className="mt-1 text-2xl font-semibold">
          Баллы за посещение салона
        </h2>
        <p className="mt-2 text-sm leading-5 text-neutral-300">
          В рабочей версии баллы начисляются после подтверждённого визита в 1С
          или вручную администратором.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-400">Статус последнего визита</p>
            <h3 className="mt-1 text-xl font-semibold">
              {visitConfirmed ? "Визит подтверждён" : "Ожидает подтверждения"}
            </h3>
            <p className="mt-2 text-sm leading-5 text-neutral-400">
              {visitConfirmed
                ? "Начислено +100 баллов. В полной версии клиент получит уведомление в Telegram."
                : "После визита администратор или 1С подтверждает посещение, и баллы начисляются автоматически."}
            </p>
          </div>

          <div
            className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white"
            style={{ backgroundColor: visitConfirmed ? brandRed : "#333333" }}
          >
            +100
          </div>
        </div>

        <button
          onClick={onConfirmVisit}
          disabled={visitConfirmed}
          className={
            visitConfirmed
              ? "mt-5 w-full rounded-2xl bg-white/10 px-5 py-4 font-semibold text-neutral-500"
              : "mt-5 w-full rounded-2xl px-5 py-4 font-semibold text-white"
          }
          style={!visitConfirmed ? { backgroundColor: brandRed } : undefined}
        >
          {visitConfirmed
            ? "Визит уже подтверждён"
            : "Смоделировать подтверждение визита"}
        </button>

        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Эта кнопка нужна только для демонстрации управляющим. В рабочей версии
          клиент не будет ничего нажимать.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <h3 className="text-xl font-semibold">Как будет в полной версии</h3>

        <div className="mt-4 grid gap-3 text-sm text-neutral-300">
          <div className="rounded-2xl bg-black/25 p-4">
            1. Клиент приходит в “Личное тело”.
          </div>
          <div className="rounded-2xl bg-black/25 p-4">
            2. Визит фиксируется в 1С или подтверждается администратором.
          </div>
          <div className="rounded-2xl bg-black/25 p-4">
            3. Mini App начисляет баллы и обновляет уровень клиента.
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileScreen({
  goal,
  reminderTime,
  interest,
  onSupport,
  onResetOnboarding,
}: {
  goal: string;
  reminderTime: string;
  interest: string;
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

      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <h3 className="text-xl font-semibold">Настройки</h3>

        <div className="mt-4 grid gap-3 text-sm">
          <ProfileRow label="Цель" value={goal || "Не выбрано"} />
          <ProfileRow label="Напоминания" value={reminderTime || "Не выбрано"} />
          <ProfileRow label="Интерес" value={interest || "Не выбрано"} />
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

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-neutral-400">{label}</span>
      <span>{value}</span>
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
    { id: "visits", label: "Визиты" },
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