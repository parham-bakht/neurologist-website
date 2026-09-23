import "server-only";
import type {Article} from "../../types/article";

const backend=process.env.BACKEND_URL||"http://localhost:8000";

export async function managedArticles(headers:Record<string,string>):Promise<{articles:Article[];error:boolean}>{
  try{const response=await fetch(`${backend}/api/v1/articles/manage`,{headers,cache:"no-store"});return response.ok?{articles:await response.json(),error:false}:{articles:[],error:true}}
  catch{return {articles:[],error:true}}
}

export async function managedArticle(id:string,headers:Record<string,string>):Promise<Article|null|undefined>{
  try{const response=await fetch(`${backend}/api/v1/articles/manage/${encodeURIComponent(id)}`,{headers,cache:"no-store"});if(response.status===404)return null;return response.ok?await response.json():undefined}
  catch{return undefined}
}
