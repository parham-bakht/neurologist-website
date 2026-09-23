import {NextResponse} from "next/server";

const backend=process.env.BACKEND_URL||"http://localhost:8000";

async function credentials(request:Request){
  const isJson=request.headers.get("content-type")?.includes("application/json")??false;
  if(isJson)return {isJson,payload:await request.json()};
  const form=await request.formData();
  return {isJson,payload:{email:String(form.get("email")||""),password:String(form.get("password")||"")}};
}

export async function POST(request:Request){
  const {isJson,payload}=await credentials(request);
  let response:Response;
  try {
    response=await fetch(`${backend}/api/v1/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
  } catch {
    return NextResponse.json({detail:"سرویس ورود در دسترس نیست. ابتدا بک‌اند را اجرا کنید."},{status:503});
  }
  const data=await response.json();
  if(!response.ok)return NextResponse.json(data,{status:response.status});
  const result=isJson?NextResponse.json({ok:true}):NextResponse.redirect(new URL("/dashboard",request.url),303);
  result.cookies.set("access_token",data.access_token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:30*60});
  return result;
}
