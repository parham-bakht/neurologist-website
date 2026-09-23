"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import {EditorContent,useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {useEffect} from "react";
import type {ArticleContent} from "../../types/article";
import {ArticleImage} from "./article-image-extension";
import {ArticleVideo} from "./article-video-extension";
import ArticleEditorToolbar from "./ArticleEditorToolbar";

export type InlineImage={src:string;alt:string;caption:string;alignment:"right"|"center"|"left";width:number};
export type InlineVideo={src:string;caption:string};

export default function RichTextEditor({content,onChange,onOpenImage,onOpenVideo,editorRef}:{content:ArticleContent;onChange:(content:ArticleContent)=>void;onOpenImage:()=>void;onOpenVideo:()=>void;editorRef?:(insertImage:(image:InlineImage)=>void,insertVideo:(video:InlineVideo)=>void)=>void}){
  const editor=useEditor({
    immediatelyRender:false,
    extensions:[
      StarterKit.configure({heading:{levels:[1,2,3]},link:false,underline:false}),
      Underline,
      Link.configure({openOnClick:false,autolink:true,HTMLAttributes:{rel:"noopener noreferrer"}}),
      TextAlign.configure({types:["heading","paragraph"]}),
      Placeholder.configure({placeholder:"متن مقاله را از اینجا شروع کنید…"}),
      Youtube.configure({controls:true,nocookie:true,allowFullscreen:true}),
      ArticleImage,
      ArticleVideo,
    ],
    content,
    onUpdate:({editor:current})=>onChange(current.getJSON() as ArticleContent),
    editorProps:{attributes:{class:"article-prose-editor",role:"textbox","aria-label":"متن مقاله"}},
  });
  useEffect(()=>{if(editor&&editorRef)editorRef(image=>editor.chain().focus().insertContent({type:"articleImage",attrs:image}).run(),video=>editor.chain().focus().insertContent({type:"articleVideo",attrs:video}).run())},[editor,editorRef]);
  return <div className="rich-editor-shell"><ArticleEditorToolbar editor={editor} onImage={onOpenImage} onVideo={onOpenVideo}/><EditorContent editor={editor}/></div>;
}
