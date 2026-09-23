"use client";

import {useMemo,useState} from "react";
import type {Article,ArticleCategory,ArticleDraft,ArticleMedia,ArticleTag} from "../../types/article";
import FeaturedImageField from "./FeaturedImageField";
import PersianCalendarField from "../../app/dashboard/persian-calendar-field";

const origin=process.env.NEXT_PUBLIC_BACKEND_URL||"http://localhost:8000";
const media=(url:string)=>url.startsWith("http")?url:`${origin}${url}`;

export default function ArticleSettingsPanel({draft,article,mediaItems,categories,tags,onChange,onTagCreate,onMedia,onSchedule,busy}:{draft:ArticleDraft;article:Article|null;mediaItems:ArticleMedia[];categories:ArticleCategory[];tags:ArticleTag[];onChange:(patch:Partial<ArticleDraft>)=>void;onTagCreate:(name:string)=>Promise<void>;onMedia:Parameters<typeof FeaturedImageField>[0]["onUploaded"];onSchedule:(localDate:string)=>void;busy:boolean}){
  const [tagSearch,setTagSearch]=useState("");
  const [tagError,setTagError]=useState("");
  const [scheduleAt,setScheduleAt]=useState(article?.scheduled_at||"");
  const [creatingTag,setCreatingTag]=useState(false);
  const selected=tags.filter(tag=>draft.tag_ids.includes(tag.id));
  const available=useMemo(()=>tags.filter(tag=>!draft.tag_ids.includes(tag.id)&&tag.name.toLocaleLowerCase("fa").includes(tagSearch.toLocaleLowerCase("fa"))).slice(0,8),[tags,draft.tag_ids,tagSearch]);
  const seoTitle=draft.seo_title||draft.title||"عنوان مقاله";
  const description=draft.meta_description||draft.excerpt||"توضیح کوتاه مقاله در نتایج جست‌وجو نمایش داده می‌شود.";
  const social=draft.social_image_url||draft.featured_image_url;
  async function createTag(){if(tagSearch.trim().length<2)return;setCreatingTag(true);setTagError("");try{await onTagCreate(tagSearch.trim());setTagSearch("")}catch(error){setTagError(error instanceof Error?error.message:"ساخت برچسب انجام نشد.")}finally{setCreatingTag(false)}}
  return <aside className="article-settings" aria-label="تنظیمات مقاله">
    <div className="settings-heading"><div><span>تنظیمات</span><h2>انتشار و نمایش</h2></div><span className={`status ${article?.status||"draft"}`}>{article?.status==="published"?"منتشرشده":article?.status==="scheduled"?"زمان‌بندی‌شده":"پیش‌نویس"}</span></div>
    <section className="settings-section publication-summary"><h3>انتشار</h3><dl><div><dt>نویسنده</dt><dd>{article?.author.full_name||"پس از اولین ذخیره"}</dd></div><div><dt>آخرین تغییر</dt><dd>{article?new Date(article.updated_at).toLocaleString("fa-IR"):"هنوز ذخیره نشده"}</dd></div>{article?.published_at&&<div><dt>انتشار</dt><dd>{new Date(article.published_at).toLocaleString("fa-IR")}</dd></div>}</dl><PersianCalendarField value={scheduleAt} includeTime label="زمان انتشار" onChange={setScheduleAt}/><button type="button" className="secondary-action full-action" disabled={busy||!scheduleAt} onClick={()=>onSchedule(scheduleAt)}>زمان‌بندی انتشار</button></section>
    <section className="settings-section"><h3>تصویر شاخص</h3><FeaturedImageField value={draft.featured_image_url} onChange={value=>onChange({featured_image_url:value})} onUploaded={onMedia}/></section>
    <section className="settings-section"><h3>دسته‌بندی</h3><label className="sr-only" htmlFor="article-category">دسته‌بندی مقاله</label><select id="article-category" value={draft.category_id||""} onChange={event=>onChange({category_id:event.target.value||null})}><option value="">بدون دسته‌بندی</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></section>
    <section className="settings-section tag-settings"><h3>برچسب‌ها</h3><div className="selected-tags">{selected.map(tag=><button type="button" key={tag.id} onClick={()=>onChange({tag_ids:draft.tag_ids.filter(id=>id!==tag.id)})}>{tag.name}<span aria-hidden="true">×</span><span className="sr-only">حذف برچسب</span></button>)}</div><label className="sr-only" htmlFor="tag-search">جست‌وجوی برچسب</label><input id="tag-search" value={tagSearch} onChange={event=>setTagSearch(event.target.value)} placeholder="جست‌وجو یا ساخت برچسب"/><div className="tag-suggestions">{available.map(tag=><button type="button" key={tag.id} onClick={()=>{onChange({tag_ids:[...draft.tag_ids,tag.id]});setTagSearch("")}}>+ {tag.name}</button>)}{tagSearch.trim().length>=2&&!tags.some(tag=>tag.name.toLocaleLowerCase("fa")===tagSearch.trim().toLocaleLowerCase("fa"))&&<button type="button" onClick={()=>void createTag()} disabled={creatingTag}>{creatingTag?"در حال ساخت…":`ساخت «${tagSearch.trim()}»`}</button>}</div></section>
    <details className="settings-section seo-settings" open><summary><span><small>تنظیمات تکمیلی</small><strong>SEO و اشتراک‌گذاری</strong></span><span aria-hidden="true">⌄</span></summary><div className="seo-fields">
      <label>عنوان SEO <span>{(draft.seo_title||"").length.toLocaleString("fa-IR")}/۶۰</span><input value={draft.seo_title||""} maxLength={120} onChange={event=>onChange({seo_title:event.target.value||null})} placeholder={draft.title||"عنوان نتیجه جست‌وجو"}/></label>
      <label>توضیحات متا <span>{(draft.meta_description||"").length.toLocaleString("fa-IR")}/۱۶۰</span><textarea value={draft.meta_description||""} maxLength={320} rows={3} onChange={event=>onChange({meta_description:event.target.value||null})} placeholder={draft.excerpt||"خلاصه‌ای برای موتورهای جست‌وجو"}/></label>
      <label>نامک مقاله <span>{draft.slug.length.toLocaleString("fa-IR")}/۲۰۰</span><input dir="ltr" value={draft.slug} maxLength={200} onChange={event=>onChange({slug:event.target.value})}/></label>
      <label>تصویر شبکه‌های اجتماعی <select value={draft.social_image_url||""} onChange={event=>onChange({social_image_url:event.target.value||null})}><option value="">استفاده از تصویر شاخص</option>{mediaItems.filter(item=>item.media_type==="image").map(item=><option key={item.id} value={item.url}>{item.original_name}</option>)}</select></label>
      <div className="seo-preview" dir="ltr"><span>example.com/articles/{draft.slug||"article"}</span><h4>{seoTitle}</h4><p>{description}</p></div>
      <div className="social-preview">{social?<img src={media(social)} alt=""/>:<div/>}<section><small>example.com</small><strong>{seoTitle}</strong><p>{description}</p></section></div>
    </div></details>
    {tagError&&<p className="editor-error" role="alert">{tagError}</p>}
  </aside>;
}
