"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import "../public-pages.css";

export default function Login() {
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (!response.ok) {
        setError(response.status >= 500 ? "ارتباط با سامانه برقرار نشد. لطفاً کمی بعد دوباره تلاش کنید." : "ایمیل یا رمز عبور صحیح نیست.");
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
          <span className="account-emblem" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="4" width="20" height="24" rx="4"/><path d="M11 12h10M11 17h10M11 22h6"/></svg></span>
          <p className="eyebrow">پنل همراه خانواده</p>
          <h2>مسیر مراقبت،<br /> همیشه در دسترس شما</h2>
          <p>با ورود به حساب کاربری، اطلاعات ویزیت‌ها و روند پیگیری درمان را در یک فضای منظم دنبال کنید.</p>
          <div className="account-benefits"><span>اطلاعات ویزیت‌ها</span><span>پیگیری درمان</span><span>مدیریت حساب کاربری</span></div>
          <span className="account-signature">نورومایند · نورولوژی کودکان</span>
        </aside>
        <section className="account-form-panel" aria-labelledby="login-title">
          <header><p className="eyebrow">خوش آمدید</p><h1 id="login-title">ورود به حساب</h1><p>برای دسترسی به پنل، اطلاعات حساب خود را وارد کنید.</p></header>
          <form action="/api/auth/login" method="post" onSubmit={submit} aria-busy={loading}>
            {error && <p className="error" role="alert">{error}</p>}
            <label htmlFor="login-email">ایمیل<input id="login-email" name="email" type="email" dir="ltr" autoComplete="email" placeholder="name@example.com" required /></label>
            <div className="account-field">
              <label htmlFor="login-password">رمز عبور</label>
              <div className="account-password"><input id="login-password" name="password" type={showPassword ? "text" : "password"} dir="ltr" autoComplete="current-password" required /><button className="password-toggle" type="button" aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "پنهان" : "نمایش"}</button></div>
            </div>
            <button className="account-submit" disabled={loading} type="submit">{loading ? "در حال ورود…" : "ورود به حساب"}<span aria-hidden="true">←</span></button>
            <p className="auth-switch">هنوز حساب ندارید؟ <Link href="/register">ثبت‌نام کنید</Link></p>
          </form>
        </section>
      </div>
    </main>
  );
}
