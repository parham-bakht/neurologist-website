import type {ArticleContent,ArticleMark,ArticleNode} from "../../types/article";

const publicOrigin=process.env.NEXT_PUBLIC_BACKEND_URL||"http://localhost:8000";
const mediaUrl=(src:string)=>src.startsWith("http")?src:`${publicOrigin}${src}`;

function safeHref(value:unknown):string|null{
  const href=String(value||"");
  return /^(https?:\/\/|mailto:|tel:)/i.test(href)?href:null;
}

function youtubeId(value:unknown):string|null{
  try{
    const url=new URL(String(value));
    if(url.hostname==="youtu.be")return /^[\w-]{6,20}$/.test(url.pathname.slice(1))?url.pathname.slice(1):null;
    if(!["youtube.com","www.youtube.com","www.youtube-nocookie.com"].includes(url.hostname))return null;
    const candidate=url.searchParams.get("v")||url.pathname.match(/\/(?:embed|shorts)\/([\w-]{6,20})/)?.[1]||"";
    return /^[\w-]{6,20}$/.test(candidate)?candidate:null;
  }catch{return null}
}

function markedText(text:string,marks:ArticleMark[]=[]){
  return marks.reduce<React.ReactNode>((child,mark,index)=>{
    if(mark.type==="bold")return <strong key={index}>{child}</strong>;
    if(mark.type==="italic")return <em key={index}>{child}</em>;
    if(mark.type==="underline")return <u key={index}>{child}</u>;
    if(mark.type==="strike")return <s key={index}>{child}</s>;
    if(mark.type==="code")return <code key={index}>{child}</code>;
    if(mark.type==="link"){
      const href=safeHref(mark.attrs?.href);
      return href?<a key={index} href={href} target={href.startsWith("http")?"_blank":undefined} rel={href.startsWith("http")?"noopener noreferrer":undefined}>{child}</a>:child;
    }
    return child;
  },text);
}

function alignment(node:ArticleNode):React.CSSProperties|undefined{
  const value=node.attrs?.textAlign;
  return value==="left"||value==="center"||value==="right"||value==="justify"?{textAlign:value}:undefined;
}

function renderNode(node:ArticleNode,key:string):React.ReactNode{
  if(node.type==="text")return <span key={key}>{markedText(node.text||"",node.marks)}</span>;
  const children=(node.content||[]).map((child,index)=>renderNode(child,`${key}-${index}`));
  if(node.type==="paragraph")return <p key={key} style={alignment(node)}>{children.length?children:<br/>}</p>;
  if(node.type==="heading"){
    const level=Number(node.attrs?.level);
    if(level===1)return <h2 key={key} style={alignment(node)}>{children}</h2>;
    if(level===3)return <h3 key={key} style={alignment(node)}>{children}</h3>;
    return <h2 key={key} style={alignment(node)}>{children}</h2>;
  }
  if(node.type==="bulletList")return <ul key={key}>{children}</ul>;
  if(node.type==="orderedList")return <ol key={key}>{children}</ol>;
  if(node.type==="listItem")return <li key={key}>{children}</li>;
  if(node.type==="blockquote")return <blockquote key={key}>{children}</blockquote>;
  if(node.type==="codeBlock")return <pre key={key} dir="ltr"><code>{children}</code></pre>;
  if(node.type==="horizontalRule")return <hr key={key}/>;
  if(node.type==="hardBreak")return <br key={key}/>;
  if(node.type==="articleImage"){
    const src=String(node.attrs?.src||"");
    if(!src.startsWith("/uploads/"))return null;
    const width=Math.min(100,Math.max(30,Number(node.attrs?.width)||100));
    const align=["right","center","left"].includes(String(node.attrs?.alignment))?String(node.attrs?.alignment):"center";
    return <figure key={key} className={`article-content-image align-${align}`} style={{width:`${width}%`}}><img src={mediaUrl(src)} alt={String(node.attrs?.alt||node.attrs?.caption||"")} loading="lazy" decoding="async"/>{node.attrs?.caption&&<figcaption>{String(node.attrs.caption)}</figcaption>}</figure>;
  }
  if(node.type==="articleVideo"){
    const src=String(node.attrs?.src||"");if(!src.startsWith("/uploads/"))return null;
    return <figure key={key} className="article-content-video"><video src={mediaUrl(src)} controls preload="metadata" playsInline/>{node.attrs?.caption&&<figcaption>{String(node.attrs.caption)}</figcaption>}</figure>;
  }
  if(node.type==="youtube"){
    const id=youtubeId(node.attrs?.src);
    return id?<div key={key} className="article-youtube"><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title="ویدیوی مقاله" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/></div>:null;
  }
  return <div key={key}>{children}</div>;
}

export default function ArticleRenderer({content,className=""}:{content:ArticleContent;className?:string}){
  return <div className={`article-renderer ${className}`.trim()}>{(content.content||[]).map((node,index)=>renderNode(node,String(index)))}</div>;
}

export function articlePlainText(content:ArticleContent):string{
  const collect=(node:ArticleNode):string=>node.type==="text"?node.text||"":node.type==="articleImage"?String(node.attrs?.alt||node.attrs?.caption||""):node.type==="articleVideo"?String(node.attrs?.caption||""):(node.content||[]).map(collect).join(" ");
  return (content.content||[]).map(collect).join(" ").replace(/\s+/g," ").trim();
}
