import {notFound,redirect} from "next/navigation";
import ArticleEditor from "../../../../../components/articles/ArticleEditor";
import {managedArticle} from "../../../../../lib/server/articles";
import {requireDashboardUser} from "../../../auth";

export default async function EditArticlePage({params}:{params:Promise<{id:string}>}){
  const {user,headers}=await requireDashboardUser();if(user.role==="user")redirect("/dashboard");
  const article=await managedArticle((await params).id,headers);if(article===null)notFound();
  if(!article)return <main className="article-editor-page"><div className="editor-state-card"><h1>دریافت مقاله انجام نشد</h1><p>اتصال سرور را بررسی و دوباره تلاش کنید.</p></div></main>;
  return <ArticleEditor initialArticle={article}/>;
}
