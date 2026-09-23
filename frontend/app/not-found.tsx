import Link from "next/link";
import type {Metadata} from "next";
import "./system-states.css";

export const metadata:Metadata={title:"صفحه پیدا نشد",robots:{index:false,follow:false}};

export default function NotFound() {
  return (
    <main className="system-state">
      <section className="system-state-card" aria-labelledby="not-found-title">
        <span className="system-state-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H7a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10l-6-6H11Z" />
            <path d="M21 4v7h6M11 17h10M11 22h6" />
          </svg>
        </span>
        <p className="system-state-kicker">صفحه پیدا نشد · ۴۰۴</p>
        <h1 id="not-found-title">مسیر دیگری را انتخاب کنید</h1>
        <p className="system-state-description">ممکن است نشانی صفحه تغییر کرده باشد یا این صفحه دیگر در دسترس نباشد. از صفحه اصلی یا بخش مقالات، مسیر خود را ادامه دهید.</p>
        <div className="system-state-actions">
          <Link className="button" href="/">بازگشت به صفحه اصلی</Link>
          <Link className="button secondary" href="/articles">مطالعه مقالات</Link>
        </div>
      </section>
    </main>
  );
}
