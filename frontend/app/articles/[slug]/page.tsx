import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {cache} from "react";
import ArticleRenderer,{articlePlainText} from "../../../components/articles/ArticleRenderer";
import JsonLd from "../../../components/seo/JsonLd";
import {absoluteMediaUrl,absoluteUrl,siteConfig} from "../../../lib/site";
import type {Article} from "../../../types/article";
import "../../public-pages.css";

const backend=process.env.BACKEND_URL||"http://localhost:8000";

const getArticle=cache(async(slug:string):Promise<Article|null|undefined>=>{
  let normalizedSlug=slug;
  try{normalizedSlug=decodeURIComponent(slug)}catch{}
  try{
    const response=await fetch(`${backend}/api/v1/articles/${encodeURIComponent(normalizedSlug)}`,{next:{revalidate:300}});
    if(response.status===404)return null;
    return response.ok?await response.json() as Article:undefined;
  }catch{return undefined}
});

function articleDescription(article:Article){
  const value=(article.meta_description||article.excerpt||articlePlainText(article.content)).replace(/\s+/g," ").trim();
  return value.length>180?`${value.slice(0,177).trimEnd()}…`:value||siteConfig.description;
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const article=await getArticle((await params).slug);
  if(!article)return {title:"مقاله پیدا نشد",robots:{index:false,follow:false}};
  const title=article.seo_title||article.title;
  const description=articleDescription(article);
  const imagePath=article.social_image_url||article.featured_image_url;
  const image=absoluteMediaUrl(imagePath)||absoluteUrl(siteConfig.defaultShareImagePath);
  const canonical=`/articles/${encodeURIComponent(article.slug)}`;
  return {
    title,
    description,
    alternates:{canonical},
    openGraph:{type:"article",url:absoluteUrl(canonical),siteName:siteConfig.name,locale:siteConfig.locale,title,description,publishedTime:article.published_at||article.created_at,modifiedTime:article.updated_at,authors:[article.author.full_name],section:article.category?.name,tags:article.tags.map(tag=>tag.name),images:[{url:image,alt:article.title}]},
    twitter:{card:"summary_large_image",title,description,images:[image]},
  };
}

export default async function ArticlePage({params}:{params:Promise<{slug:string}>}){
  const article=await getArticle((await params).slug);
  if(article===null)notFound();
  if(!article)throw new Error("Public article service is unavailable");

  const wordCount=articlePlainText(article.content).split(/\s+/).filter(Boolean).length;
  const readingMinutes=Math.max(1,Math.ceil(wordCount/200));
  const displayDate=article.published_at||article.created_at;
  const description=articleDescription(article);
  const canonicalPath=`/articles/${encodeURIComponent(article.slug)}`;
  const canonical=absoluteUrl(canonicalPath);
  const imagePath=article.social_image_url||article.featured_image_url;
  const shareImage=absoluteMediaUrl(imagePath)||absoluteUrl(siteConfig.defaultShareImagePath);
  const featuredAsset=article.media.find(item=>item.url===article.featured_image_url);
  const structuredData=[
    {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"خانه",item:absoluteUrl("/")},{"@type":"ListItem",position:2,name:"مقالات",item:absoluteUrl("/articles")},{"@type":"ListItem",position:3,name:article.title,item:canonical}]},
    {"@context":"https://schema.org","@type":"BlogPosting",headline:article.title,description,image:[shareImage],datePublished:article.published_at||article.created_at,dateModified:article.updated_at,inLanguage:siteConfig.language,mainEntityOfPage:{"@type":"WebPage","@id":canonical},author:{"@type":"Person",name:article.author.full_name},publisher:{"@type":"Person",name:siteConfig.doctorName,url:absoluteUrl("/"),image:absoluteUrl(siteConfig.logoPath)},articleSection:article.category?.name||undefined,keywords:article.tags.length?article.tags.map(tag=>tag.name).join(", "):undefined,wordCount},
  ];

  return <><JsonLd data={structuredData}/><main className="journal-detail">
    <nav className="public-breadcrumbs" aria-label="مسیر صفحه"><Link href="/">خانه</Link><span aria-hidden="true">←</span><Link href="/articles">مقالات</Link><span aria-hidden="true">←</span><span aria-current="page">{article.title}</span></nav>
    <article>
      <header className="journal-article-header">
        <p className="eyebrow">{article.category?.name||"مجله نورومایند"}</p>
        <h1>{article.title}</h1>
        {article.excerpt&&<p className="journal-deck">{article.excerpt}</p>}
        <div className="journal-byline"><span className="journal-author-mark" aria-hidden="true">{article.author.full_name.trim().slice(0,1)}</span><div><span>نوشته {article.author.full_name}</span><span className="journal-date"><time dateTime={displayDate}>انتشار: {new Date(displayDate).toLocaleDateString("fa-IR-u-ca-persian",{year:"numeric",month:"long",day:"numeric"})}</time><time dateTime={article.updated_at}>به‌روزرسانی: {new Date(article.updated_at).toLocaleDateString("fa-IR-u-ca-persian",{year:"numeric",month:"long",day:"numeric"})}</time><span>حدود {readingMinutes.toLocaleString("fa-IR")} دقیقه مطالعه</span></span></div></div>
      </header>
      {article.featured_image_url&&<figure className="journal-detail-cover"><img src={absoluteMediaUrl(article.featured_image_url)||undefined} alt={featuredAsset?.alt_text||article.title} width={featuredAsset?.width||undefined} height={featuredAsset?.height||undefined} loading="eager" fetchPriority="high" decoding="async"/>{featuredAsset?.caption&&<figcaption>{featuredAsset.caption}</figcaption>}</figure>}
      <ArticleRenderer content={article.content} className="journal-article-body"/>
      {article.tags.length>0&&<div className="journal-tags" aria-label="برچسب‌های مقاله">{article.tags.map(tag=><span key={tag.id}>{tag.name}</span>)}</div>}
      <footer className="journal-article-footer"><div><span className="eyebrow">مطالعه بیشتر</span><h2>همراه شما در مسیر آگاهی</h2></div><Link className="journal-text-link" href="/articles">همه مطالب مجله <span aria-hidden="true">←</span></Link></footer>
    </article>
  </main></>;
}
