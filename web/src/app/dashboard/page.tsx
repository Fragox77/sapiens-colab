"use client";

import { clearSession, getMe, getStoredUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const response = await getMe();
        if (mounted) {
          setUser(response.data);
        }
      } catch (err) {
        clearSession();
        if (mounted) {
          setError(err instanceof Error ? err.message : "Sesión inválida");
          router.push("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Cargando panel...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-platinum px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-coral">
              Panel privado
            </p>
            <h1 className="text-3xl font-black text-cobalt">
              Bienvenido a SAPIENS COLAB
            </h1>
            <p className="mt-2 text-slate-600">
              Esta es la base del dashboard. Aquí luego conectamos proyectos,
              cotizador, finanzas y postulaciones.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cerrar sesión
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Nombre" value={user?.name || "-"} />
          <Card title="Correo" value={user?.email || "-"} />
          <Card title="Rol" value={user?.role || "-"} />
        </div>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-platinum p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="text-lg font-semibold text-cobalt">{value}</p>
    </div>
  );
}
