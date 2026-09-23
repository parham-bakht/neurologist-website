"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {articlesApi} from "../lib/api/articles";
import type {Article,ArticleDraft,ArticleNode} from "../types/article";
import type {SaveState} from "../components/articles/AutosaveIndicator";

function meaningful(nodes:ArticleNode[]|undefined):boolean{return (nodes||[]).some(node=>(node.type==="text"&&Boolean(node.text?.trim()))||["articleImage","youtube"].includes(node.type)||meaningful(node.content))}
const snapshot=(draft:ArticleDraft)=>JSON.stringify(draft);

export default function useArticleAutosave({draft,initialArticle,onSaved,onError}:{draft:ArticleDraft;initialArticle:Article|null;onSaved:(article:Article)=>void;onError:(message:string)=>void}){
  const [state,setState]=useState<SaveState>("saved");
  const draftRef=useRef(draft);
  const articleId=useRef(initialArticle?.id||null);
  const savedSnapshot=useRef(snapshot(draft));
  const active=useRef<Promise<Article|null>|null>(null);
  const queued=useRef(false);

  const canSave=useCallback((value:ArticleDraft)=>value.title.trim().length>=3&&meaningful(value.content.content),[]);
  const perform=useCallback(async(force=false):Promise<Article|null>=>{
    const current=draftRef.current;
    const currentSnapshot=snapshot(current);
    if(!canSave(current))return null;
    if(!force&&currentSnapshot===savedSnapshot.current){setState("saved");return null}
    if(active.current){
      queued.current=true;
      const result=await active.current;
      if(snapshot(draftRef.current)===savedSnapshot.current)return result;
      return perform(force);
    }
    setState("saving");
    const operation=(articleId.current?articlesApi.update(articleId.current,current):articlesApi.create(current))
      .then(article=>{
        articleId.current=article.id;
        savedSnapshot.current=currentSnapshot;
        onSaved(article);
        if(snapshot(draftRef.current)===currentSnapshot)setState("saved");else{setState("dirty");queued.current=true}
        return article;
      })
      .catch(error=>{const message=error instanceof Error?error.message:"ذخیره خودکار انجام نشد.";setState("error");onError(message);if(force)throw error;return null})
      .finally(()=>{active.current=null});
    active.current=operation;
    const result=await operation;
    if(queued.current){queued.current=false;if(snapshot(draftRef.current)!==savedSnapshot.current)window.setTimeout(()=>void perform(),0)}
    return result;
  },[canSave,onError,onSaved]);

  useEffect(()=>{
    draftRef.current=draft;
    const changed=snapshot(draft)!==savedSnapshot.current;
    if(!changed){setState("saved");return}
    setState(previous=>previous==="saving"?previous:"dirty");
    if(!canSave(draft))return;
    const timer=window.setTimeout(()=>void perform(),1600);
    return()=>window.clearTimeout(timer);
  },[draft,canSave,perform]);

  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(state!=="saved"){event.preventDefault();event.returnValue=""}};
    const protectInternalNavigation=(event:MouseEvent)=>{
      if(state==="saved"||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const link=(event.target as Element|null)?.closest<HTMLAnchorElement>("a[href]");
      if(!link||link.target==="_blank"||link.hasAttribute("download"))return;
      const destination=new URL(link.href,window.location.href);
      if(destination.origin!==window.location.origin)return;
      if(destination.pathname===window.location.pathname&&destination.search===window.location.search&&destination.hash)return;
      if(!window.confirm("تغییرات ذخیره‌نشده دارید. از ویرایشگر خارج می‌شوید؟")){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload",warn);
    document.addEventListener("click",protectInternalNavigation,true);
    return()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",protectInternalNavigation,true)};
  },[state]);

  const saveNow=useCallback(async()=>{queued.current=false;return perform(true)},[perform]);
  return {state,saveNow,isUnsaved:state!=="saved",articleId};
}
