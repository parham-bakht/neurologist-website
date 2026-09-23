import Link from "next/link";
import type { Metadata } from "next";
import type { Article } from "../../types/article";
import JsonLd from "../../components/seo/JsonLd";
import {absoluteMediaUrl,absoluteUrl,siteConfig} from "../../lib/site";
import "../public-pages.css";

const description="مقالات و راهنماهای تخصصی درباره مغز و اعصاب کودکان، تشنج، سردرد، رشد عصبی و موضوعات کاربردی برای والدین.";
export const metadata: Metadata = {
  title:"مقالات مغز و اعصاب کودکان",
  description,
  alternates:{canonical:"/articles"},
  openGraph:{type:"website",url:absoluteUrl("/articles"),title:`مقالات مغز و اعصاب کودکان | ${siteConfig.name}`,description,images:[{url:absoluteUrl(siteConfig.defaultShareImagePath),width:1200,height:630,alt:"مجله مغز و اعصاب کودکان"}]},
  twitter:{card:"summary_large_image",title:`مقالات مغز و اعصاب کودکان | ${siteConfig.name}`,description,images:[absoluteUrl(siteConfig.defaultShareImagePath)]},
};
const backend = process.env.BACKEND_URL || "http://localhost:8000";

export default async function Articles() {
  let articles: Article[] = [];
  let unavailable = false;
  try {
    const response = await fetch(`${backend}/api/v1/articles`, { next:{revalidate:300} });
    if (response.ok) articles = await response.json();
    else unavailable = true;
  } catch { unavailable = true; }

  return (
    <><JsonLd data={{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"خانه",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:"مقالات",item:absoluteUrl("/articles")} ]}}/><main className="journal-page">
      <nav className="public-breadcrumbs" aria-label="مسیر صفحه"><Link href="/">خانه</Link><span aria-hidden="true">←</span><span aria-current="page">مقالات</span></nav>
      <header className="journal-hero">
        <div><p className="eyebrow">مجله نورومایند</p><h1>راهنمای روشن برای<br /><span>ذهن‌های در حال رشد.</span></h1><p>مطالب تیم نورولوژی کودکان برای کمک به آگاهی، آمادگی و آرامش بیشتر خانواده‌ها.</p></div>
        <div className="journal-hero-mark" aria-hidden="true"><svg viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2"><path d="M48 27c-10-8-24-9-35-3v47c11-6 25-5 35 3m0-47c10-8 24-9 35-3v47c-11-6-25-5-35 3V27Z"/><path d="M23 37c5-1 11 0 16 3M23 48c5-1 11 0 16 3M57 40c5-3 11-4 16-3M57 51c5-3 11-4 16-3"/></svg><span>آگاهی، قدم اول همراهی</span></div>
      </header>
      <div className="journal-section-heading"><h2>تازه‌ترین مطالب</h2><span>برای مطالعه و آگاهی بیشتر</span></div>
      {articles.length === 0 ? (
        <section className="journal-empty" aria-labelledby="journal-empty-title">
          <span className="journal-empty-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 8C12 5 7 5 3 7v19c4-2 9-2 13 1m0-19c4-3 9-3 13-1v19c-4-2-9-2-13 1V8Z"/></svg></span>
          <h2 id="journal-empty-title">{unavailable ? "دریافت مطالب موقتاً ممکن نیست" : "مطالب تازه در راه است"}</h2>
          <p>{unavailable ? "لطفاً کمی بعد دوباره به مجله سر بزنید." : "تیم درمانی ما در حال آماده‌سازی منابع کاربردی برای خانواده‌هاست."}</p>
          <Link className="journal-text-link" href="/">بازگشت به صفحه اصلی <span aria-hidden="true">←</span></Link>
        </section>
      ) : (
        <section className="journal-grid" aria-label="مقالات نورومایند">
          {articles.map(article => {
            const asset=article.media.find(item=>item.url===article.featured_image_url);
            return (
            <Link href={`/articles/${article.slug}`} className="journal-card" key={article.id}>
              <div className="journal-card-cover">
                {article.featured_image_url ? <img src={absoluteMediaUrl(article.featured_image_url)||undefined} alt={asset?.alt_text||article.title} width={asset?.width||undefined} height={asset?.height||undefined} loading="lazy" decoding="async" /> : <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M32 17c-7-5-16-5-23-2v34c7-3 16-3 23 2m0-34c7-5 16-5 23-2v34c-7-3-16-3-23 2V17Z"/><path d="M17 25h7M17 32h7M40 25h7M40 32h7"/></svg>}
                <span className="journal-card-category">{article.category?.name||"مجله نورومایند"}</span>
              </div>
              <div className="journal-card-content">
                <p className="journal-card-meta"><span>{article.author.full_name}</span><time dateTime={article.updated_at}>{new Date(article.updated_at).toLocaleDateString("fa-IR")}</time></p>
                <h2>{article.title}</h2><p className="journal-card-excerpt">{article.excerpt}</p><span className="journal-read-more">مطالعه مقاله <span aria-hidden="true">←</span></span>
              </div>
            </Link>
          )})}
        </section>
      )}
    </main></>
  );
}
