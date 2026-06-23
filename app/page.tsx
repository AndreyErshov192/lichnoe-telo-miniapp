"use client";

import { useMemo, useState } from "react";

type Tab = "today" | "progress" | "rewards" | "bonus" | "profile";

const missions = [
  {
    id: 1,
    title: "2 минуты тишины",
    description: "Отложите телефон и просто побудьте в тишине.",
    points: 10,
  },
  {
    id: 2,
    title: "Расслабить плечи",
    description: "Сделайте 5 медленных кругов плечами.",
    points: 10,
  },
  {
    id: 3,
    title: "Стакан воды",
    description: "Выпейте стакан воды до кофе или сладкого.",
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
    description: "Клубный апгрейд или доступ к закрытому формату.",
    unlocked: false,
  },
];

const card =
  "rounded-[26px] border border-white/[0.07] bg-white/[0.045] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.24)]";
const cardHighlight =
  "rounded-[26px] border border-white/[0.12] bg-gradient-to-b from-white/[0.09] to-white/[0.04] p-5";
const btnPrimary =
  "rounded-2xl bg-[#f4f1ea] px-5 py-3.5 text-[15px] font-semibold text-[#121212] transition active:scale-[0.98] disabled:opacity-60";
const btnGhost =
  "rounded-2xl border border-white/[0.1] bg-white/[0.06] px-5 py-3.5 text-[15px] font-medium text-neutral-300";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);

  const basePoints = 80;

  const earnedPoints = completedMissions.reduce((sum, missionId) => {
    const mission = missions.find((item) => item.id === missionId);
    return sum + (mission?.points ?? 0);
  }, 0);

  const totalPoints = basePoints + earnedPoints;

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

  const openSupport = () => {
    alert(
      "В боевой версии здесь откроется Telegram-бот и начнётся первичный диалог с поддержкой."
    );
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(244,241,234,0.07),transparent_70%)]" />

      <section className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28 pt-6 sm:px-5">
        <DemoBadge />
        <Header totalPoints={totalPoints} currentLevel={currentLevel.name} />

        <div className="flex-1">
          {activeTab === "today" && (
            <TodayScreen
              totalPoints={totalPoints}
              currentLevel={currentLevel.name}
              nextLevel={nextLevel?.name}
              progressPercent={progressPercent}
              completedMissions={completedMissions}
              onCompleteMission={completeMission}
            />
          )}

          {activeTab === "progress" && (
            <ProgressScreen
              totalPoints={totalPoints}
              currentLevel={currentLevel.name}
              nextLevel={nextLevel?.name}
              progressPercent={progressPercent}
              completedMissionsCount={completedMissions.length}
            />
          )}

          {activeTab === "rewards" && <RewardsScreen />}

          {activeTab === "bonus" && <BonusScreen />}

          {activeTab === "profile" && <ProfileScreen onSupport={openSupport} />}
        </div>
      </section>

      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
    </main>
  );
}

function DemoBadge() {
  return (
    <div className="mb-4 flex items-center justify-center">
      <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1 text-[11px] font-medium tracking-wide text-amber-200/90">
        Демо-прототип · данные не сохраняются
      </span>
    </div>
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
    <header className="mb-5">
      <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-neutral-500">
        Клуб восстановления
      </p>
      <h1 className="mt-1.5 text-[34px] font-semibold leading-tight tracking-tight text-[#f4f1ea]">
        Личное тело
      </h1>
      <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-neutral-400">
        Мягкий ритм заботы о теле — внутри Telegram
      </p>

      <div className={`${cardHighlight} mt-5 flex items-center justify-between gap-4`}>
        <div>
          <p className="text-[12px] uppercase tracking-wide text-neutral-500">
            Ваш статус
          </p>
          <p className="mt-1 text-[22px] font-semibold text-[#f4f1ea]">
            {currentLevel}
          </p>
        </div>

        <div className="rounded-[18px] bg-[#f4f1ea] px-4 py-2.5 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
            Баллы
          </p>
          <p className="text-[22px] font-semibold leading-none text-[#121212]">
            {totalPoints}
          </p>
        </div>
      </div>
    </header>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#d4cfc4] to-[#f4f1ea] transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function TodayScreen({
  totalPoints,
  currentLevel,
  nextLevel,
  progressPercent,
  completedMissions,
  onCompleteMission,
}: {
  totalPoints: number;
  currentLevel: string;
  nextLevel?: string;
  progressPercent: number;
  completedMissions: number[];
  onCompleteMission: (missionId: number) => void;
}) {
  const doneCount = completedMissions.length;

  return (
    <div className="space-y-4">
      <section className={cardHighlight}>
        <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          Сегодня
        </p>
        <h2 className="mt-1.5 text-[26px] font-semibold leading-tight text-[#f4f1ea]">
          {doneCount === missions.length
            ? "День завершён"
            : `${missions.length - doneCount} ритуала ждут вас`}
        </h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-neutral-400">
          Короткие практики восстановления — без спешки и без давления.
          Отметьте выполненное, чтобы двигаться к следующему уровню клуба.
        </p>

        <div className="mt-5 space-y-2.5">
          <div className="flex justify-between text-[13px] text-neutral-500">
            <span>{currentLevel}</span>
            <span>
              {nextLevel ? `→ ${nextLevel}` : "высший уровень клуба"}
            </span>
          </div>
          <ProgressBar percent={progressPercent} />
          <p className="text-[12px] text-neutral-500">
            {totalPoints} баллов · {progressPercent}% до следующего статуса
          </p>
        </div>
      </section>

      <div>
        <p className="mb-3 px-1 text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          Ритуалы дня
        </p>
        <div className="space-y-3">
          {missions.map((mission, index) => {
            const isCompleted = completedMissions.includes(mission.id);

            return (
              <div
                key={mission.id}
                className={`${card} ${isCompleted ? "border-emerald-400/15 bg-emerald-400/[0.04]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                      isCompleted
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-white/[0.08] text-neutral-400"
                    }`}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold leading-snug text-[#f4f1ea]">
                      {mission.title}
                    </p>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-400">
                      {mission.description}
                    </p>
                    <p className="mt-3 text-[13px] font-medium text-neutral-300">
                      +{mission.points} баллов клуба
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onCompleteMission(mission.id)}
                  disabled={isCompleted}
                  className={`mt-4 w-full ${isCompleted ? btnGhost : btnPrimary}`}
                >
                  {isCompleted ? "Ритуал принят" : "Отметить выполненным"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="px-1 text-center text-[11px] leading-relaxed text-neutral-600">
        Демо: нажатия сохраняются только до перезагрузки страницы
      </p>
    </div>
  );
}

function ProgressScreen({
  totalPoints,
  currentLevel,
  nextLevel,
  progressPercent,
  completedMissionsCount,
}: {
  totalPoints: number;
  currentLevel: string;
  nextLevel?: string;
  progressPercent: number;
  completedMissionsCount: number;
}) {
  const stats = [
    { label: "Стрик", value: "3 дня", hint: "Демо-значение" },
    {
      label: "Ритуалы",
      value: `${completedMissionsCount}/${missions.length}`,
      hint: "Сегодня",
    },
    { label: "Сториз", value: "0", hint: "За месяц" },
    { label: "Визиты", value: "0", hint: "В клуб" },
  ];

  return (
    <div className="space-y-4">
      <section className={cardHighlight}>
        <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          Прогресс
        </p>
        <h2 className="mt-1.5 text-[36px] font-semibold leading-none text-[#f4f1ea]">
          {totalPoints}
          <span className="ml-2 text-[16px] font-normal text-neutral-500">
            баллов
          </span>
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-neutral-400">
          Вы — участник уровня «{currentLevel}». Каждый ритуал и визит
          приближают к клубным привилегиям.
        </p>

        <div className="mt-5 space-y-2.5">
          <ProgressBar percent={progressPercent} />
          <p className="text-[13px] text-neutral-500">
            {nextLevel
              ? `До «${nextLevel}» — ${progressPercent}% пути пройдено`
              : "Вы достигли высшего уровня в этом демо"}
          </p>
        </div>
      </section>

      <div>
        <p className="mb-3 px-1 text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          Ваша активность
        </p>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className={card}>
              <p className="text-[12px] text-neutral-500">{stat.label}</p>
              <p className="mt-2 text-[26px] font-semibold text-[#f4f1ea]">
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] text-neutral-600">{stat.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="px-1 text-center text-[11px] leading-relaxed text-neutral-600">
        Демо: стрик, визиты и сториз — заглушки для визуального прототипа
      </p>
    </div>
  );
}

function RewardsScreen() {
  return (
    <div className="space-y-4">
      <section className={cardHighlight}>
        <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          Привилегии
        </p>
        <h2 className="mt-1.5 text-[26px] font-semibold leading-tight text-[#f4f1ea]">
          Уровни клуба
        </h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-neutral-400">
          Баллы открывают доступ к заботе о вас — приоритетные окна,
          закрытые форматы и персональные бонусы. Без бесконечных скидок.
        </p>
      </section>

      <div className="space-y-3">
        {rewards.map((reward) => (
          <div
            key={reward.title}
            className={
              reward.unlocked
                ? "rounded-[26px] border border-[#f4f1ea]/20 bg-[#f4f1ea] p-5 text-[#121212] shadow-[0_8px_32px_rgba(244,241,234,0.12)]"
                : card
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className={
                    reward.unlocked
                      ? "text-[11px] font-medium uppercase tracking-wide text-neutral-500"
                      : "text-[11px] font-medium uppercase tracking-wide text-neutral-500"
                  }
                >
                  {reward.level}
                </p>
                <h3 className="mt-1 text-[17px] font-semibold leading-snug">
                  {reward.title}
                </h3>
                <p
                  className={
                    reward.unlocked
                      ? "mt-2 text-[14px] leading-relaxed text-neutral-600"
                      : "mt-2 text-[14px] leading-relaxed text-neutral-400"
                  }
                >
                  {reward.description}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  reward.unlocked
                    ? "bg-[#121212]/10 text-neutral-600"
                    : "bg-white/[0.06] text-neutral-500"
                }`}
              >
                {reward.unlocked ? "Открыто" : "Скоро"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="px-1 text-center text-[11px] leading-relaxed text-neutral-600">
        Демо: статусы привилегий зафиксированы для показа интерфейса
      </p>
    </div>
  );
}

function BonusScreen() {
  return (
    <div className="space-y-4">
      <section className={cardHighlight}>
        <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          Бонусы
        </p>
        <h2 className="mt-1.5 text-[26px] font-semibold leading-tight text-[#f4f1ea]">
          Подтверждённые действия
        </h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-neutral-400">
          Баллы за реальные шаги: визит в клуб и отметка в сториз.
          В боевой версии здесь будет проверка администратором.
        </p>
      </section>

      <section className={card}>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-sm">
            ◎
          </span>
          <h3 className="text-[18px] font-semibold text-[#f4f1ea]">
            Код визита
          </h3>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-neutral-400">
          После сеанса администратор выдаст персональный код — введите его,
          чтобы начислить баллы за визит.
        </p>

        <div className="mt-4 rounded-2xl border border-dashed border-white/[0.12] bg-black/20 px-4 py-3.5 text-[15px] text-neutral-500">
          LT-1206
        </div>

        <button className={`${btnPrimary} mt-4 w-full opacity-70`} disabled>
          Подтвердить визит
        </button>
        <p className="mt-2.5 text-center text-[11px] text-neutral-600">
          Кнопка неактивна в демо-режиме
        </p>
      </section>

      <section className={card}>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-sm">
            ✦
          </span>
          <h3 className="text-[18px] font-semibold text-[#f4f1ea]">
            Сториз-бонус
          </h3>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-neutral-400">
          Отметьте «Личное тело» в сториз, загрузите скрин — команда проверит
          и начислит баллы в течение суток.
        </p>

        <button className={`${btnPrimary} mt-4 w-full opacity-70`} disabled>
          Загрузить скрин
        </button>
        <p className="mt-2.5 text-center text-[11px] text-neutral-600">
          Загрузка недоступна в демо · проверка вручную
        </p>
      </section>
    </div>
  );
}

function ProfileScreen({ onSupport }: { onSupport: () => void }) {
  const settings = [
    { label: "Напоминания", value: "Утро, 9:00" },
    { label: "Фокус", value: "Расслабление" },
    { label: "Ограничения", value: "Не указаны" },
  ];

  return (
    <div className="space-y-4">
      <section className={cardHighlight}>
        <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          Профиль
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/[0.06] text-[20px] font-semibold text-[#f4f1ea]">
            Н
          </div>
          <div>
            <h2 className="text-[24px] font-semibold text-[#f4f1ea]">Наташа</h2>
            <p className="mt-0.5 text-[14px] text-neutral-400">
              Участница клуба · демо-профиль
            </p>
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-white/[0.04] px-4 py-3 text-[14px] leading-relaxed text-neutral-300">
          Цель: мягкое восстановление и расслабление после рабочих недель
        </p>
      </section>

      <section className={card}>
        <h3 className="text-[17px] font-semibold text-[#f4f1ea]">Настройки</h3>
        <p className="mt-1 text-[13px] text-neutral-500">
          Персонализация ритуалов и напоминаний
        </p>

        <div className="mt-4 divide-y divide-white/[0.06]">
          {settings.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
            >
              <span className="text-[14px] text-neutral-500">{item.label}</span>
              <span className="text-[14px] font-medium text-neutral-200">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={onSupport}
        className={`${btnPrimary} w-full text-left`}
      >
        Написать администратору
      </button>

      <p className="px-1 text-center text-[11px] leading-relaxed text-neutral-600">
        Демо: имя и настройки — пример для прототипа интерфейса
      </p>
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
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "today", label: "Сегодня", icon: "○" },
    { id: "progress", label: "Прогресс", icon: "↗" },
    { id: "rewards", label: "Привилегии", icon: "★" },
    { id: "bonus", label: "Бонусы", icon: "+" },
    { id: "profile", label: "Профиль", icon: "◎" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-white/[0.06] bg-[#121214]/90 px-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 transition ${
                isActive
                  ? "bg-white/[0.1] text-[#f4f1ea]"
                  : "text-neutral-500 active:bg-white/[0.04]"
              }`}
            >
              <span className={`text-[15px] ${isActive ? "opacity-100" : "opacity-60"}`}>
                {tab.icon}
              </span>
              <span
                className={`text-[10px] leading-tight ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
