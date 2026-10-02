"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./login.module.css";
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    checkExistingSession();
  }, []);
  async function checkExistingSession() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: isAdmin } =
      await supabase.rpc("is_admin");
    if (isAdmin) {
      router.replace("/admin");
    }
  }
  async function login(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const {
      data,
      error: loginError,
    } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (loginError || !data.user) {
      setError(
        "Adresse e-mail ou mot de passe incorrect."
      );
      setLoading(false);
      return;
    }
    const {
      data: isAdmin,
      error: adminError,
    } =
      await supabase.rpc("is_admin");
    if (adminError || !isAdmin) {
      await supabase.auth.signOut();
      setError(
        "Ce compte n'est pas autorisé à administrer CREDESS."
      );
      setLoading(false);
      return;
    }
    router.replace("/admin");
  }
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.mark}>
            <i />
            <i />
            <i />
          </div>
          <div>
            <strong>CREDESS</strong>
            <small>ADMINISTRATION</small>
          </div>
        </div>
        <div className={styles.intro}>
          <small>ESPACE SÉCURISÉ</small>
          <h1>
            Administration
          </h1>
          <p>
            Connectez-vous pour gérer CREDESS Construction.
          </p>
        </div>
        <form onSubmit={login}>
          <label>
            Adresse e-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="admin@credess.com"
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              required
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
            />
          </label>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          <button disabled={loading}>
            {loading
              ? "Connexion..."
              : "Se connecter"}
            <span>→</span>
          </button>
        </form>
      </section>
    </main>
  );
}