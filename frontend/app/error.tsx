"use client";

import Link from "next/link";
import "./system-states.css";

export default function Error({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return (
    <main className="system-state">
      <section className="system-state-card" aria-labelledby="error-title">
        <span className="system-state-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M26 11a11 11 0 1 0 1 8M26 4v7h-7" />
            <path d="M16 10v7m0 5h.01" />
          </svg>
        </span>
        <p className="system-state-kicker">وقفه‌ای کوتاه در نمایش صفحه</p>
        <h1 id="error-title">این صفحه فعلاً در دسترس نیست</h1>
        <p className="system-state-description">نمایش اطلاعات با مشکل روبه‌رو شد. لطفاً دوباره تلاش کنید؛ اگر مشکل ادامه داشت، کمی بعد به این صفحه برگردید.</p>
        <div className="system-state-actions">
          <button type="button" onClick={reset}>تلاش دوباره</button>
          <Link className="button secondary" href="/">بازگشت به صفحه اصلی</Link>
        </div>
      </section>
    </main>
  );
}
