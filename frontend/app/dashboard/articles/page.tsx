import Link from "next/link";
import {redirect} from "next/navigation";
import ArticleList from "../../../components/articles/ArticleList";
import {managedArticles} from "../../../lib/server/articles";
import {requireDashboardUser} from "../auth";

export default async function ArticlesDashboard(){
  const {user,headers}=await requireDashboardUser();
  if(user.role==="user")redirect("/dashboard");
  const {articles,error}=await managedArticles(headers);
  const published=articles.filter(article=>article.status==="published").length;
  const drafts=articles.filter(article=>article.status==="draft").length;
  const scheduled=articles.filter(article=>article.status==="scheduled").length;
  return <main className="dashboard-shell article-library-page">
    <Link className="back-link" href="/dashboard">← بازگشت به پنل</Link>
    <header className="article-library-header"><div><p className="eyebrow">مرکز انتشار</p><h1>مقالات و محتوای آموزشی</h1><p>پیش‌نویس‌ها، مطالب زمان‌بندی‌شده و مقاله‌های منتشرشده را از یک فضای منظم مدیریت کنید.</p></div><Link className="button" href="/dashboard/articles/new">+ مقاله جدید</Link></header>
    <div className="article-library-stats"><div><strong>{articles.length.toLocaleString("fa-IR")}</strong><span>همه مقاله‌ها</span></div><div><strong>{published.toLocaleString("fa-IR")}</strong><span>منتشرشده</span></div><div><strong>{drafts.toLocaleString("fa-IR")}</strong><span>پیش‌نویس</span></div><div><strong>{scheduled.toLocaleString("fa-IR")}</strong><span>زمان‌بندی‌شده</span></div></div>
    <ArticleList initialArticles={articles} loadError={error}/>
  </main>;
}
