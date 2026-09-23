"use client";

import Link from "next/link";
import {useMemo,useState} from "react";
import {articlesApi} from "../../lib/api/articles";
import type {Article,ArticleStatus} from "../../types/article";
import ConfirmDialog from "./ConfirmDialog";

const origin=process.env.NEXT_PUBLIC_BACKEND_URL||"http://localhost:8000";
const media=(url:string)=>url.startsWith("http")?url:`${origin}${url}`;
const labels:Record<ArticleStatus,string>={draft:"پیش‌نویس",published:"منتشرشده",scheduled:"زمان‌بندی‌شده"};

export default function ArticleList({initialArticles,loadError=false}:{initialArticles:Article[];loadError?:boolean}){
  const [articles,setArticles]=useState(initialArticles);
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState<ArticleStatus|"all">("all");
  const [pending,setPending]=useState<string|null>(null);
  const [deleteTarget,setDeleteTarget]=useState<Article|null>(null);
  const [message,setMessage]=useState("");
  const filtered=useMemo(()=>articles.filter(article=>(status==="all"||article.status===status)&&article.title.toLocaleLowerCase("fa").includes(query.trim().toLocaleLowerCase("fa"))),[articles,query,status]);
  async function remove(article:Article){
    setPending(article.id);setMessage("");
    try{await articlesApi.delete(article.id);setArticles(current=>current.filter(item=>item.id!==article.id));setMessage("مقاله حذف شد.");setDeleteTarget(null)}
    catch(error){setMessage(error instanceof Error?error.message:"حذف مقاله انجام نشد.");setDeleteTarget(null)}finally{setPending(null)}
  }
  return <>
    <div className="article-list-controls"><label><span className="sr-only">جست‌وجوی مقاله</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="جست‌وجو در عنوان مقاله‌ها…"/></label><label><span className="sr-only">فیلتر وضعیت</span><select value={status} onChange={event=>setStatus(event.target.value as ArticleStatus|"all")}><option value="all">همه وضعیت‌ها</option><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option><option value="scheduled">زمان‌بندی‌شده</option></select></label></div>
    {message&&<p className="article-list-message" role="status">{message}</p>}
    {loadError?<div className="editor-state-card"><h2>دریافت مقاله‌ها انجام نشد</h2><p>اتصال سرور را بررسی و صفحه را دوباره بارگذاری کنید.</p></div>:filtered.length===0?<div className="editor-state-card"><span aria-hidden="true">✦</span><h2>{articles.length?"مقاله‌ای با این فیلتر پیدا نشد":"اولین مقاله را آماده کنید"}</h2><p>{articles.length?"عبارت جست‌وجو یا وضعیت را تغییر دهید.":"یک پیش‌نویس بسازید و محتوای آموزشی را با ساختاری حرفه‌ای منتشر کنید."}</p>{!articles.length&&<Link className="button" href="/dashboard/articles/new">ایجاد مقاله جدید</Link>}</div>:<div className="professional-article-list">{filtered.map(article=><article key={article.id}>
      <div className="article-row-cover">{article.featured_image_url?<img src={media(article.featured_image_url)} alt=""/>:<span>آ</span>}</div>
      <div className="article-row-main"><div><span className={`status ${article.status}`}>{labels[article.status]}</span>{article.category&&<span className="article-category-pill">{article.category.name}</span>}</div><h2>{article.title}</h2><p>{article.excerpt||"برای این مقاله هنوز خلاصه‌ای نوشته نشده است."}</p><small>آخرین تغییر {new Date(article.updated_at).toLocaleString("fa-IR")} · {article.author.full_name}</small></div>
      <div className="article-row-actions"><Link className="button secondary-action" href={`/dashboard/articles/${article.id}/edit`}>ویرایش</Link>{article.status==="published"&&<a className="text-button" href={`/articles/${encodeURIComponent(article.slug)}`} target="_blank" rel="noopener noreferrer">مشاهده ↗</a>}<button className="text-button danger-text" disabled={pending!==null} onClick={()=>setDeleteTarget(article)}>حذف</button></div>
    </article>)}</div>}
    <ConfirmDialog open={Boolean(deleteTarget)} title="حذف این مقاله؟" description={deleteTarget?`مقاله «${deleteTarget.title}» برای همیشه حذف می‌شود و امکان بازگردانی آن وجود ندارد.`:""} confirmLabel="بله، حذف شود" tone="danger" busy={Boolean(pending)} onCancel={()=>setDeleteTarget(null)} onConfirm={()=>{if(deleteTarget)void remove(deleteTarget)}}/>
  </>;
}
