"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession, dashboardPath } from "@/lib/auth";
import { authApi } from "@/lib/api";

type Mode = "login" | "register";

interface AuthFormProps {
  mode: Mode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "client"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = isRegister
        ? await authApi.register({
            name: form.name,
            email: form.email,
            password: form.password,
          })
        : await authApi.login(form.email, form.password);

      saveSession(response.token, response.user);
      router.push(dashboardPath(response.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <h1 className="mb-2 text-3xl font-bold text-cobalt">
        {isRegister ? "Crear cuenta" : "Iniciar sesión"}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {isRegister
          ? "Registra tu acceso a SAPIENS COLAB"
          : "Ingresa a tu panel"}
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {isRegister && (
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nombre
          </label>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cobalt"
            placeholder="Jhon Fragozo"
            required
          />
        </div>
      )}

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Correo
        </label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cobalt"
          placeholder="correo@ejemplo.com"
          required
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cobalt"
          placeholder="******"
          required
        />
      </div>

      {isRegister && (
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Rol
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cobalt"
          >
            <option value="client">Cliente</option>
            <option value="designer">Diseñador</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-coral px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Procesando..." : isRegister ? "Registrarme" : "Entrar"}
      </button>
    </form>
  );
}
