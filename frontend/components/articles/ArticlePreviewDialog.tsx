"use client";

import {useEffect,useRef} from "react";
import type {Article,ArticleDraft} from "../../types/article";
import ArticleRenderer,{articlePlainText} from "./ArticleRenderer";

const origin=process.env.NEXT_PUBLIC_BACKEND_URL||"http://localhost:8000";
const media=(url:string)=>url.startsWith("http")?url:`${origin}${url}`;

export default function ArticlePreviewDialog({open,draft,article,onClose}:{open:boolean;draft:ArticleDraft;article:Article|null;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;if(!dialog)return;if(open&&!dialog.open)dialog.showModal();if(!open&&dialog.open)dialog.close()},[open]);
  const words=articlePlainText(draft.content).split(/\s+/).filter(Boolean).length;
  return <dialog ref={ref} className="article-preview-dialog" onCancel={event=>{event.preventDefault();onClose()}} onClose={()=>{if(open)onClose()}} aria-labelledby="preview-title">
    <div className="preview-browser-bar"><span>پیش‌نمایش مقاله</span><button onClick={onClose} aria-label="بستن پیش‌نمایش">×</button></div>
    <article className="article-preview-sheet">
      <header><span>{article?.category?.name||"مجله نورومایند"}</span><h1 id="preview-title">{draft.title||"عنوان مقاله"}</h1>{draft.excerpt&&<p>{draft.excerpt}</p>}<div className="preview-byline"><b>{article?.author.full_name||"نویسنده"}</b><span>{new Date().toLocaleDateString("fa-IR")} · حدود {Math.max(1,Math.ceil(words/200)).toLocaleString("fa-IR")} دقیقه مطالعه</span></div></header>
      {draft.featured_image_url&&<img className="preview-featured" src={media(draft.featured_image_url)} alt=""/>}
      <ArticleRenderer content={draft.content}/>
    </article>
  </dialog>;
}
