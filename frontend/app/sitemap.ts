import type {MetadataRoute} from "next";
import type {Article} from "../types/article";
import {absoluteUrl} from "../lib/site";

export const dynamic="force-dynamic";
const backend=process.env.BACKEND_URL||"http://localhost:8000";

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const entries:MetadataRoute.Sitemap=[
    {url:absoluteUrl("/"),changeFrequency:"weekly",priority:1},
    {url:absoluteUrl("/about"),changeFrequency:"monthly",priority:.8},
    {url:absoluteUrl("/articles"),changeFrequency:"weekly",priority:.8},
  ];
  try{
    const response=await fetch(`${backend}/api/v1/articles`,{next:{revalidate:300}});
    if(response.ok){
      const articles:Article[]=await response.json();
      entries.push(...articles.map(article=>({
        url:absoluteUrl(`/articles/${encodeURIComponent(article.slug)}`),
        lastModified:new Date(article.updated_at),
        changeFrequency:"monthly" as const,
        priority:.7,
      })));
    }
  }catch{}
  return entries;
}
