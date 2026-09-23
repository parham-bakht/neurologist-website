"use client";

import {NodeViewWrapper,type NodeViewProps,ReactNodeViewRenderer} from "@tiptap/react";

const mediaOrigin=process.env.NEXT_PUBLIC_BACKEND_URL||"http://localhost:8000";

export default function ArticleVideoNodeView({node,deleteNode,selected}:NodeViewProps){
  const {src,caption}=node.attrs as {src:string;caption:string};
  const videoSrc=src.startsWith("http")?src:`${mediaOrigin}${src}`;
  return <NodeViewWrapper as="figure" className={`editor-video-node ${selected?"is-selected":""}`} data-article-video="">
    <div className="editor-video-frame"><video src={videoSrc} controls preload="metadata" playsInline/><button type="button" className="editor-video-delete" aria-label="حذف ویدئو" title="حذف ویدئو" onMouseDown={event=>{event.preventDefault();deleteNode()}}>×</button></div>
    {caption&&<figcaption>{caption}</figcaption>}
  </NodeViewWrapper>;
}

export {ReactNodeViewRenderer};
