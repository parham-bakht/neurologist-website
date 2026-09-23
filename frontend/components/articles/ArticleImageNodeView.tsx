"use client";

import {NodeViewWrapper,type NodeViewProps,ReactNodeViewRenderer} from "@tiptap/react";

const mediaOrigin=process.env.NEXT_PUBLIC_BACKEND_URL||"http://localhost:8000";

export default function ArticleImageNodeView({node,deleteNode,selected}:NodeViewProps){
  const {src,alt,caption,alignment,width}=node.attrs as {src:string;alt:string;caption:string;alignment:"right"|"center"|"left";width:number};
  const imageSrc=src.startsWith("http")?src:`${mediaOrigin}${src}`;
  return <NodeViewWrapper as="figure" className={`editor-image-node editor-image-${alignment} ${selected?"is-selected":""}`} data-article-image="" data-alignment={alignment} data-width={width}>
    <div className="editor-image-frame"><img src={imageSrc} alt={alt||""} style={{width:`${Number(width)||100}%`}} draggable={false}/><button type="button" className="editor-image-delete" aria-label="حذف تصویر" title="حذف تصویر" onMouseDown={event=>{event.preventDefault();deleteNode()}}>×</button></div>
    {caption&&<figcaption>{caption}</figcaption>}
  </NodeViewWrapper>;
}

export {ReactNodeViewRenderer};
