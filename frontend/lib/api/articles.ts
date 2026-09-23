import type {Article,ArticleCategory,ArticleDraft,ArticleMedia,ArticleTag} from "../../types/article";

export class ApiError extends Error{
  constructor(message:string,public status:number){super(message);this.name="ApiError";}
}

async function request<T>(url:string,options?:RequestInit):Promise<T>{
  let response:Response;
  try{response=await fetch(url,{...options,headers:{...(options?.body?{"Content-Type":"application/json"}:{}),...options?.headers}})}
  catch{throw new ApiError("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.",0)}
  if(response.status===204)return undefined as T;
  const data=await response.json().catch(()=>({detail:"پاسخ نامعتبر از سرور دریافت شد."}));
  if(!response.ok)throw new ApiError(typeof data.detail==="string"?data.detail:"انجام عملیات ممکن نشد.",response.status);
  return data as T;
}

export const articlesApi={
  create:(data:ArticleDraft)=>request<Article>("/api/articles",{method:"POST",body:JSON.stringify(data)}),
  getById:(id:string)=>request<Article>(`/api/articles/${id}`),
  update:(id:string,data:Partial<ArticleDraft>)=>request<Article>(`/api/articles/${id}`,{method:"PATCH",body:JSON.stringify(data)}),
  publish:(id:string)=>request<Article>(`/api/articles/${id}/publish`,{method:"POST"}),
  unpublish:(id:string)=>request<Article>(`/api/articles/${id}/unpublish`,{method:"POST"}),
  schedule:(id:string,scheduledAt:string)=>request<Article>(`/api/articles/${id}/schedule`,{method:"POST",body:JSON.stringify({scheduled_at:scheduledAt})}),
  delete:(id:string)=>request<void>(`/api/articles/${id}`,{method:"DELETE"}),
};

export const taxonomiesApi={
  categories:()=>request<ArticleCategory[]>("/api/categories"),
  tags:(search="")=>request<ArticleTag[]>(`/api/tags${search?`?search=${encodeURIComponent(search)}`:""}`),
  createTag:(name:string)=>request<ArticleTag>("/api/tags",{method:"POST",body:JSON.stringify({name})}),
};

export const mediaApi={
  uploadImage(file:File,metadata:{altText?:string;caption?:string},onProgress?:(progress:number)=>void):Promise<ArticleMedia>{
    return new Promise((resolve,reject)=>{
      const body=new FormData();
      body.append("file",file);
      body.append("alt_text",metadata.altText||"");
      body.append("caption",metadata.caption||"");
      const xhr=new XMLHttpRequest();
      xhr.open("POST","/api/articles/media");
      xhr.upload.addEventListener("progress",event=>{if(event.lengthComputable)onProgress?.(Math.round(event.loaded/event.total*100))});
      xhr.addEventListener("load",()=>{
        let data:{detail?:string}&Partial<ArticleMedia>={};
        try{data=JSON.parse(xhr.responseText)}catch{}
        if(xhr.status>=200&&xhr.status<300)resolve(data as ArticleMedia);
        else reject(new ApiError(data.detail||"بارگذاری تصویر انجام نشد.",xhr.status));
      });
      xhr.addEventListener("error",()=>reject(new ApiError("ارتباط هنگام بارگذاری تصویر قطع شد.",0)));
      xhr.send(body);
    });
  },
  uploadVideo(file:File,metadata:{caption?:string},onProgress?:(progress:number)=>void):Promise<ArticleMedia>{
    return new Promise((resolve,reject)=>{
      const body=new FormData();body.append("file",file);body.append("caption",metadata.caption||"");
      const xhr=new XMLHttpRequest();xhr.open("POST","/api/articles/videos");
      xhr.upload.addEventListener("progress",event=>{if(event.lengthComputable)onProgress?.(Math.round(event.loaded/event.total*100))});
      xhr.addEventListener("load",()=>{let data:{detail?:string}&Partial<ArticleMedia>={};try{data=JSON.parse(xhr.responseText)}catch{}if(xhr.status>=200&&xhr.status<300)resolve(data as ArticleMedia);else reject(new ApiError(data.detail||"بارگذاری ویدئو انجام نشد.",xhr.status))});
      xhr.addEventListener("error",()=>reject(new ApiError("ارتباط هنگام بارگذاری ویدئو قطع شد.",0)));xhr.send(body);
    });
  },
  delete:(id:string)=>request<void>(`/api/articles/media/${id}`,{method:"DELETE"}),
};
