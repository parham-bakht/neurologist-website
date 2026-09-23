"use client";

import Link from "next/link";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {ApiError,articlesApi,taxonomiesApi} from "../../lib/api/articles";
import useArticleAutosave from "../../hooks/useArticleAutosave";
import type {Article,ArticleCategory,ArticleDraft,ArticleMedia,ArticleTag} from "../../types/article";
import {EMPTY_ARTICLE_CONTENT} from "../../types/article";
import ArticleImageDialog from "./ArticleImageDialog";
import ArticleVideoDialog from "./ArticleVideoDialog";
import ArticlePreviewDialog from "./ArticlePreviewDialog";
import ArticleSettingsPanel from "./ArticleSettingsPanel";
import AutosaveIndicator from "./AutosaveIndicator";
import ConfirmDialog from "./ConfirmDialog";
import RichTextEditor,{type InlineImage,type InlineVideo} from "./RichTextEditor";

type Dialog="publish"|"unpublish"|"delete"|null;

export function slugify(value:string):string{return value.normalize("NFKC").toLocaleLowerCase("fa").replace(/_/g,"-").replace(/[^\p{L}\p{N}]+/gu,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,190)||"article"}
function hasPublishableContent(nodes:ArticleDraft["content"]["content"]):boolean{return (nodes||[]).some(node=>(node.type==="text"&&Boolean(node.text?.trim()))||node.type==="articleImage"||node.type==="articleVideo"||node.type==="youtube"||hasPublishableContent(node.content))}

function initialDraft(article:Article|null):ArticleDraft{return article?{
  title:article.title,slug:article.slug,excerpt:article.excerpt,content:article.content,
  featured_image_url:article.featured_image_url,social_image_url:article.social_image_url,
  category_id:article.category?.id||null,tag_ids:article.tags.map(tag=>tag.id),
  seo_title:article.seo_title,meta_description:article.meta_description,media_ids:article.media.map(item=>item.id),
}:{title:"",slug:"",excerpt:"",content:EMPTY_ARTICLE_CONTENT,featured_image_url:null,social_image_url:null,category_id:null,tag_ids:[],seo_title:null,meta_description:null,media_ids:[]}}

export default function ArticleEditor({initialArticle=null}:{initialArticle?:Article|null}){
  const [article,setArticle]=useState<Article|null>(initialArticle);
  const [draft,setDraft]=useState<ArticleDraft>(()=>initialDraft(initialArticle));
  const [mediaItems,setMediaItems]=useState<ArticleMedia[]>(initialArticle?.media||[]);
  const [categories,setCategories]=useState<ArticleCategory[]>([]);
  const [tags,setTags]=useState<ArticleTag[]>(initialArticle?.tags||[]);
  const [metadataError,setMetadataError]=useState("");
  const [notice,setNotice]=useState<{tone:"success"|"error";text:string}|null>(null);
  const [busy,setBusy]=useState(false);
  const [imageDialog,setImageDialog]=useState(false);
  const [videoDialog,setVideoDialog]=useState(false);
  const [preview,setPreview]=useState(false);
  const [dialog,setDialog]=useState<Dialog>(null);
  const [slugManual,setSlugManual]=useState(Boolean(initialArticle));
  const insertImage=useRef<(image:InlineImage)=>void>(()=>{});
  const insertVideo=useRef<(video:InlineVideo)=>void>(()=>{});

  const handleSaved=useCallback((saved:Article)=>{
    setArticle(saved);
    setDraft(current=>current.slug===saved.slug?current:{...current,slug:saved.slug});
    setMediaItems(current=>[...saved.media,...current.filter(item=>!saved.media.some(savedItem=>savedItem.id===item.id))]);
    if(window.location.pathname.endsWith("/new"))window.history.replaceState({},"",`/dashboard/articles/${saved.id}/edit`);
  },[]);
  const handleAutosaveError=useCallback((message:string)=>setNotice({tone:"error",text:message}),[]);
  const autosave=useArticleAutosave({draft,initialArticle,onSaved:handleSaved,onError:handleAutosaveError});

  useEffect(()=>{
    let cancelled=false;
    Promise.all([taxonomiesApi.categories(),taxonomiesApi.tags()]).then(([loadedCategories,loadedTags])=>{
      if(cancelled)return;setCategories(loadedCategories);setTags(current=>[...loadedTags,...current.filter(tag=>!loadedTags.some(item=>item.id===tag.id))]);
    }).catch(error=>{if(!cancelled)setMetadataError(error instanceof Error?error.message:"دریافت دسته‌بندی و برچسب‌ها انجام نشد.")});
    return()=>{cancelled=true};
  },[]);

  const update=useCallback((patch:Partial<ArticleDraft>)=>{
    if(Object.prototype.hasOwnProperty.call(patch,"slug"))setSlugManual(true);
    setDraft(current=>({...current,...patch}));
  },[]);
  const titleChanged=(title:string)=>setDraft(current=>({...current,title,slug:slugManual?current.slug:slugify(title)}));
  const addMedia=useCallback((media:ArticleMedia)=>{
    setMediaItems(current=>current.some(item=>item.id===media.id)?current:[...current,media]);
    setDraft(current=>({...current,media_ids:current.media_ids.includes(media.id)?current.media_ids:[...current.media_ids,media.id]}));
  },[]);
  const setInserter=useCallback((imageHandler:(image:InlineImage)=>void,videoHandler:(video:InlineVideo)=>void)=>{insertImage.current=imageHandler;insertVideo.current=videoHandler},[]);
  const createTag=async(name:string)=>{const tag=await taxonomiesApi.createTag(name);setTags(current=>current.some(item=>item.id===tag.id)?current:[...current,tag]);setDraft(current=>({...current,tag_ids:current.tag_ids.includes(tag.id)?current.tag_ids:[...current.tag_ids,tag.id]}))};

  async function saveDraft(){
    setBusy(true);setNotice(null);
    try{const saved=await autosave.saveNow();if(saved)setNotice({tone:"success",text:"پیش‌نویس ذخیره شد."});else if(draft.title.trim().length<3)setNotice({tone:"error",text:"برای ذخیره، عنوان مقاله را کامل کنید."});else setNotice({tone:"error",text:"برای ذخیره، متن مقاله را وارد کنید."})}
    catch(error){setNotice({tone:"error",text:error instanceof Error?error.message:"ذخیره پیش‌نویس انجام نشد."})}
    finally{setBusy(false)}
  }
  async function publish(){
    setBusy(true);setNotice(null);
    try{
      const saved=await autosave.saveNow();const id=saved?.id||article?.id;
      if(!id)throw new ApiError("عنوان و متن مقاله را پیش از انتشار کامل کنید.",422);
      const published=await articlesApi.publish(id);handleSaved(published);setDialog(null);setNotice({tone:"success",text:"مقاله با موفقیت منتشر شد."});
    }catch(error){setNotice({tone:"error",text:error instanceof Error?error.message:"انتشار مقاله انجام نشد."});setDialog(null)}finally{setBusy(false)}
  }
  async function unpublish(){
    if(!article)return;setBusy(true);setNotice(null);
    try{const updated=await articlesApi.unpublish(article.id);handleSaved(updated);setDialog(null);setNotice({tone:"success",text:"مقاله به پیش‌نویس بازگردانده شد."})}
    catch(error){setNotice({tone:"error",text:error instanceof Error?error.message:"لغو انتشار انجام نشد."});setDialog(null)}finally{setBusy(false)}
  }
  async function schedule(localDate:string){
    setBusy(true);setNotice(null);
    try{
      const date=new Date(localDate);if(Number.isNaN(date.getTime())||date.getTime()<=Date.now())throw new ApiError("زمان انتشار باید در آینده باشد.",422);
      const saved=await autosave.saveNow();const id=saved?.id||article?.id;if(!id)throw new ApiError("عنوان و متن مقاله را پیش از زمان‌بندی کامل کنید.",422);
      const scheduled=await articlesApi.schedule(id,date.toISOString());handleSaved(scheduled);setNotice({tone:"success",text:"انتشار مقاله زمان‌بندی شد."});
    }catch(error){setNotice({tone:"error",text:error instanceof Error?error.message:"زمان‌بندی انجام نشد."})}finally{setBusy(false)}
  }
  async function remove(){
    if(!article)return;setBusy(true);
    try{await articlesApi.delete(article.id);window.location.assign("/dashboard/articles")}
    catch(error){setNotice({tone:"error",text:error instanceof Error?error.message:"حذف مقاله انجام نشد."});setDialog(null);setBusy(false)}
  }
  const statusLabel=article?.status==="published"?"منتشرشده":article?.status==="scheduled"?"زمان‌بندی‌شده":"پیش‌نویس";
  const canPublish=Boolean(draft.title.trim().length>=3&&draft.slug&&hasPublishableContent(draft.content.content));
  const titleLength=draft.title.length;
  const excerptLength=draft.excerpt.length;
  const headerActions=useMemo(()=>article?.status==="published"?<button type="button" className="secondary-action" onClick={()=>setDialog("unpublish")}>لغو انتشار</button>:<button type="button" className="publish-action" disabled={!canPublish||busy} onClick={()=>setDialog("publish")}>انتشار</button>,[article?.status,busy,canPublish]);

  return <main className="article-editor-page">
    <header className="article-editor-header">
      <div><Link href="/dashboard/articles">→ مقالات</Link><span className="editor-document-status">{statusLabel}</span></div>
      <div className="editor-header-actions"><AutosaveIndicator state={autosave.state}/><button type="button" className="secondary-action" onClick={()=>setPreview(true)}>پیش‌نمایش</button><button type="button" className="secondary-action" onClick={()=>void saveDraft()} disabled={busy}>ذخیره پیش‌نویس</button>{headerActions}<button type="button" className="settings-jump" onClick={()=>document.querySelector(".article-settings")?.scrollIntoView({behavior:"smooth"})}>تنظیمات</button></div>
    </header>
    {notice&&<div className={`editor-notice ${notice.tone}`} role={notice.tone==="error"?"alert":"status"}><span>{notice.text}</span><button onClick={()=>setNotice(null)} aria-label="بستن پیام">×</button></div>}
    {metadataError&&<div className="editor-notice error" role="alert">{metadataError}</div>}
    <div className="article-workspace">
      <section className="article-writing-canvas" aria-label="ویرایش مقاله">
        <div className="document-meta-line"><span>{article?`ویرایش مقاله · ${article.author.full_name}`:"مقاله جدید"}</span><span>{titleLength.toLocaleString("fa-IR")}/۱۸۰</span></div>
        <textarea className="article-title-input" rows={1} value={draft.title} maxLength={180} onChange={event=>titleChanged(event.target.value)} onInput={event=>{const field=event.currentTarget;field.style.height="auto";field.style.height=`${field.scrollHeight}px`}} placeholder="عنوان مقاله را بنویسید" aria-label="عنوان مقاله"/>
        <div className="excerpt-field"><textarea rows={2} value={draft.excerpt} maxLength={320} onChange={event=>update({excerpt:event.target.value})} placeholder="خلاصه کوتاهی برای کارت مقاله و معرفی مطلب بنویسید…" aria-label="خلاصه مقاله"/><span className={excerptLength>200?"over-recommendation":""}>{excerptLength.toLocaleString("fa-IR")}/۲۰۰ پیشنهادی</span></div>
      <RichTextEditor content={draft.content} onChange={content=>update({content})} onOpenImage={()=>setImageDialog(true)} onOpenVideo={()=>setVideoDialog(true)} editorRef={setInserter}/>
      </section>
      <ArticleSettingsPanel draft={draft} article={article} mediaItems={mediaItems} categories={categories} tags={tags} onChange={update} onTagCreate={createTag} onMedia={addMedia} onSchedule={local=>void schedule(local)} busy={busy}/>
    </div>
    {article&&<div className="editor-danger-zone"><div><strong>حذف مقاله</strong><span>این عملیات قابل بازگشت نیست؛ فایل‌های رسانه‌ای برای جلوگیری از حذف ناخواسته نگه‌داری می‌شوند.</span></div><button className="danger-action" onClick={()=>setDialog("delete")}>حذف مقاله</button></div>}
    <ArticleImageDialog open={imageDialog} onClose={()=>setImageDialog(false)} onUploaded={addMedia} onInsert={image=>insertImage.current(image)}/>
    <ArticleVideoDialog open={videoDialog} onClose={()=>setVideoDialog(false)} onUploaded={addMedia} onInsert={video=>insertVideo.current(video)}/>
    <ArticlePreviewDialog open={preview} draft={draft} article={article} onClose={()=>setPreview(false)}/>
    <ConfirmDialog open={dialog==="publish"} title="مقاله منتشر شود؟" description="این مقاله بلافاصله برای کاربران وب‌سایت قابل مشاهده خواهد بود." confirmLabel="انتشار مقاله" busy={busy} onCancel={()=>setDialog(null)} onConfirm={()=>void publish()}/>
    <ConfirmDialog open={dialog==="unpublish"} title="انتشار مقاله لغو شود؟" description="مقاله از بخش عمومی حذف و به پیش‌نویس بازگردانده می‌شود." confirmLabel="لغو انتشار" busy={busy} onCancel={()=>setDialog(null)} onConfirm={()=>void unpublish()}/>
    <ConfirmDialog open={dialog==="delete"} title="مقاله حذف شود؟" description="این عملیات قابل بازگشت نیست و مقاله برای همیشه حذف خواهد شد." confirmLabel="حذف مقاله" tone="danger" busy={busy} onCancel={()=>setDialog(null)} onConfirm={()=>void remove()}/>
  </main>;
}
