"use client";

import {FormEvent,useEffect,useRef,useState} from "react";
import {ApiError,mediaApi} from "../../lib/api/articles";
import {validateArticleVideo} from "../../lib/articles/video-validation";
import type {ArticleMedia} from "../../types/article";
import type {InlineVideo} from "./RichTextEditor";

export default function ArticleVideoDialog({open,onClose,onUploaded,onInsert}:{open:boolean;onClose:()=>void;onUploaded:(media:ArticleMedia)=>void;onInsert:(video:InlineVideo)=>void}){
  const dialog=useRef<HTMLDialogElement>(null);const [file,setFile]=useState<File|null>(null);const [preview,setPreview]=useState("");const [progress,setProgress]=useState(0);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{const element=dialog.current;if(!element)return;if(open&&!element.open)element.showModal();if(!open&&element.open)element.close()},[open]);
  useEffect(()=>{if(!file){setPreview("");return}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file]);
  const select=(next:File|null)=>{setFile(next);setError(next?validateArticleVideo(next)||"":"")};
  const close=()=>{if(busy)return;setFile(null);setError("");setProgress(0);onClose()};
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!file)return;const issue=validateArticleVideo(file);if(issue){setError(issue);return}const data=new FormData(event.currentTarget);setBusy(true);setError("");try{const caption=String(data.get("caption")||"").trim();const media=await mediaApi.uploadVideo(file,{caption},setProgress);onUploaded(media);onInsert({src:media.url,caption});setFile(null);setProgress(0);onClose()}catch(caught){setError(caught instanceof ApiError?caught.message:"بارگذاری ویدئو انجام نشد.")}finally{setBusy(false)}}
  return <dialog ref={dialog} className="article-dialog video-dialog" onCancel={event=>{event.preventDefault();close()}} onClose={()=>{if(open&&!busy)onClose()}} aria-labelledby="inline-video-title"><form onSubmit={submit}>
    <header><div><span>رسانه درون متن</span><h2 id="inline-video-title">افزودن ویدئو</h2></div><button type="button" className="dialog-close" onClick={close} aria-label="بستن">×</button></header>
    <label className={`video-dropzone ${preview?"has-video":""}`} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();select(event.dataTransfer.files[0]||null)}}>{preview?<video src={preview} controls preload="metadata"/>:<><strong>ویدئو را اینجا رها کنید</strong><span>یا برای انتخاب MP4 یا WebM کلیک کنید</span><small>حداکثر ۱۰۰ مگابایت</small></>}<input type="file" accept="video/mp4,video/webm" required={!file} onChange={event=>select(event.target.files?.[0]||null)}/></label>
    <label>زیرنویس <span>اختیاری</span><input name="caption" maxLength={500} placeholder="توضیح کوتاه زیر ویدئو"/></label>
    {busy&&<div className="upload-progress" role="status"><span style={{width:`${progress}%`}}/><small>در حال بارگذاری… {progress.toLocaleString("fa-IR")}٪</small></div>}{error&&<p className="editor-error" role="alert">{error}</p>}
    <footer><button type="button" className="secondary-action" onClick={close} disabled={busy}>انصراف</button><button disabled={!file||busy}>{busy?"در حال بارگذاری…":"بارگذاری و درج ویدئو"}</button></footer>
  </form></dialog>;
}
