"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type User = {
  id: string;
  telegram_id: string;
  name: string | null;
  phone: string | null;
  points_balance: number | null;
  goal: string | null;
  reminder_time: string | null;
  interests: string | null;
  streak_count: number | null;
  last_active_date: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);
  const [adminPin, setAdminPin] = useState("");
  const [isAdminAccessGranted, setIsAdminAccessGranted] =
  useState(false);
  const [adminAccessError, setAdminAccessError] =
  useState("");

  useEffect(() => {
  if (!isAdminAccessGranted) return;

  loadUsers();
}, [isAdminAccessGranted]);

async function checkAdminAccess() {
  setAdminAccessError("");

  try {
    const response = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pin: adminPin,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setAdminAccessError(data.error || "Ошибка входа");
      return;
    }

    setIsAdminAccessGranted(true);
  } catch {
    setAdminAccessError("Не удалось проверить PIN-код");
  }
}

  async function loadUsers() {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, telegram_id, name, phone, points_balance, goal, reminder_time, interests, streak_count, last_active_date, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Ошибка загрузки пользователей:", error);
      setIsLoading(false);
      return;
    }

    setUsers(data ?? []);
    setIsLoading(false);
  }

async function confirmVisit(user: User) {
  const isConfirmed = window.confirm(
    `Подтвердить новый визит клиента «${user.name || "Без имени"}» и начислить 100 баллов?`
  );

  if (!isConfirmed || confirmingUserId) return;

  setConfirmingUserId(user.id);

  const visitPoints = 100;
  const newPointsBalance =
    Number(user.points_balance ?? 0) + visitPoints;

  const { data: newVisit, error: visitError } = await supabase
    .from("visits")
    .insert({
      user_id: user.id,
      visit_date: new Date().toISOString(),
      status: "confirmed",
      paid: true,
      points_awarded: false,
      service: "Подтверждено администратором",
    })
    .select("id")
    .single();

  if (visitError) {
    console.error("Ошибка создания визита:", visitError);
    alert(`Не удалось создать визит: ${visitError.message}`);
    setConfirmingUserId(null);
    return;
  }

  const { error: transactionError } = await supabase
    .from("points_transactions")
    .insert({
      user_id: user.id,
      type: "visit",
      amount: visitPoints,
      source: "Визит подтверждён администратором",
      source_id: newVisit.id,
    });

  if (transactionError) {
    console.error("Ошибка создания транзакции:", transactionError);
    alert(`Не удалось записать начисление: ${transactionError.message}`);
    setConfirmingUserId(null);
    return;
  }

  const { error: balanceError } = await supabase
    .from("users")
    .update({
      points_balance: newPointsBalance,
    })
    .eq("id", user.id);

  if (balanceError) {
    console.error("Ошибка обновления баланса:", balanceError);
    alert(`Не удалось обновить баланс: ${balanceError.message}`);
    setConfirmingUserId(null);
    return;
  }

  const { error: visitUpdateError } = await supabase
    .from("visits")
    .update({
      points_awarded: true,
    })
    .eq("id", newVisit.id);

  if (visitUpdateError) {
    console.error(
      "Ошибка завершения подтверждения визита:",
      visitUpdateError
    );
    alert(
      `Баллы начислены, но статус визита не обновлён: ${visitUpdateError.message}`
    );
    setConfirmingUserId(null);
    return;
  }

  setUsers((currentUsers) =>
    currentUsers.map((currentUser) =>
      currentUser.id === user.id
        ? {
            ...currentUser,
            points_balance: newPointsBalance,
          }
        : currentUser
    )
  );

  setConfirmingUserId(null);
  alert(`Визит подтверждён. Начислено +${visitPoints} баллов.`);
}

if (!isAdminAccessGranted) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0E0E0E] px-5 text-white">
      <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-sm text-neutral-400">Админка</p>

        <h1 className="mt-1 text-2xl font-semibold">
          Вход для администратора
        </h1>

        <input
          type="password"
          inputMode="numeric"
          value={adminPin}
          onChange={(event) => setAdminPin(event.target.value)}
          placeholder="Введите PIN-код"
          className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
        />

        {adminAccessError && (
          <p className="mt-2 text-sm text-red-400">
            {adminAccessError}
          </p>
        )}

        <button
          onClick={checkAdminAccess}
          className="mt-4 w-full rounded-2xl bg-[#E30613] px-4 py-3 font-semibold text-white"
        >
          Войти
        </button>
      </section>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#0E0E0E] px-5 py-8 text-white">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm text-neutral-400">Админка</p>

        <h1 className="mt-1 text-3xl font-semibold">
          Управление клубом
        </h1>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <h2 className="text-xl font-semibold">Клиенты</h2>

          {isLoading ? (
            <p className="mt-4 text-sm text-neutral-400">
              Загрузка клиентов...
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl bg-black/25 p-4"
                >
                  <p className="font-semibold">
                    {user.name || "Без имени"}
                  </p>

                  <p className="mt-1 text-sm text-neutral-400">
                    Telegram ID: {user.telegram_id}
                  </p>

                  <p className="mt-1 text-sm text-neutral-400">
                    Баллы: {user.points_balance ?? 0}
                  </p>
                  <button
                    onClick={() => confirmVisit(user)}
                    disabled={confirmingUserId !== null}
                     className="mt-4 w-full rounded-2xl bg-[#E30613] px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                     {confirmingUserId === user.id
                       ? "Подтверждаем..."
                      : "Подтвердить визит"}
                    </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}