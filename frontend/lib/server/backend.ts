import {cookies} from "next/headers";
import {NextResponse} from "next/server";

const backend=process.env.BACKEND_URL||"http://localhost:8000";

export async function authorizedBackend(path:string,init:RequestInit={}):Promise<Response|NextResponse>{
  const token=(await cookies()).get("access_token")?.value;
  if(!token)return NextResponse.json({detail:"Unauthorized"},{status:401});
  return fetch(`${backend}${path}`,{...init,headers:{Authorization:`Bearer ${token}`,...init.headers},cache:"no-store"});
}

export async function backendJson(response:Response|NextResponse):Promise<NextResponse>{
  if(response instanceof NextResponse)return response;
  if(response.status===204)return new NextResponse(null,{status:204});
  const text=await response.text();
  return new NextResponse(text,{status:response.status,headers:{"Content-Type":response.headers.get("content-type")||"application/json"}});
}
