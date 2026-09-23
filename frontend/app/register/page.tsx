"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import "../public-pages.css";

export default function Register() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.get("full_name"), email: form.get("email"), password: form.get("password") }),
      });
      if (!response.ok) {
        setError(response.status === 409 ? "این ایمیل قبلاً ثبت شده است. می‌توانید وارد حساب خود شوید." : "ساخت حساب انجام نشد. لطفاً دوباره تلاش کنید.");
        setLoading(false);
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setError("ارتباط برقرار نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.");
      setLoading(false);
    }
  }

  return (
    <main className="account-page">
      <Link className="public-back-link" href="/">→ بازگشت به صفحه اصلی</Link>
      <div className="account-layout">
        <aside className="account-intro">
          <span className="account-emblem" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="16" cy="11" r="5"/><path d="M6 28v-3a10 10 0 0 1 20 0v3M23 8h6M26 5v6"/></svg></span>
          <p className="eyebrow">پنل همراه خانواده</p>
          <h2>شروعی ساده،<br /> برای پیگیری منظم‌تر</h2>
          <p>حساب کاربری خود را بسازید تا اطلاعات ویزیت‌ها و پیگیری‌های درمانی در دسترس شما باشد.</p>
          <div className="account-benefits"><span>اطلاعات ویزیت‌ها</span><span>پیگیری درمان</span><span>مدیریت حساب کاربری</span></div>
          <span className="account-signature">نورومایند · نورولوژی کودکان</span>
        </aside>
        <section className="account-form-panel" aria-labelledby="register-title">
          <header><p className="eyebrow">به ما بپیوندید</p><h1 id="register-title">ساخت حساب کاربری</h1><p>اطلاعات زیر را برای ایجاد حساب خود تکمیل کنید.</p></header>
          <form action="/api/auth/register" method="post" onSubmit={submit} aria-busy={loading}>
            {error && <p className="error" role="alert">{error}</p>}
            <label htmlFor="register-name">نام و نام خانوادگی<input id="register-name" name="full_name" autoComplete="name" minLength={2} placeholder="نام کامل شما" required /></label>
            <label htmlFor="register-email">ایمیل<input id="register-email" name="email" type="email" dir="ltr" autoComplete="email" placeholder="name@example.com" required /></label>
            <div className="account-field">
              <label htmlFor="register-password">رمز عبور</label>
              <div className="account-password"><input id="register-password" name="password" type={showPassword ? "text" : "password"} dir="ltr" minLength={8} autoComplete="new-password" aria-describedby="password-hint" required /><button className="password-toggle" type="button" aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "پنهان" : "نمایش"}</button></div>
              <small id="password-hint" className="account-field-hint">رمز عبور باید حداقل ۸ نویسه داشته باشد.</small>
            </div>
            <button className="account-submit" disabled={loading} type="submit">{loading ? "در حال ساخت حساب…" : "ساخت حساب کاربری"}<span aria-hidden="true">←</span></button>
            <p className="auth-switch">از قبل حساب دارید؟ <Link href="/login">وارد شوید</Link></p>
          </form>
        </section>
      </div>
    </main>
  );
}
