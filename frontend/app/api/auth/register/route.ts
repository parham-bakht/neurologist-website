import {NextResponse} from "next/server";

const backend=process.env.BACKEND_URL||"http://localhost:8000";

async function registration(request:Request){
  const isJson=request.headers.get("content-type")?.includes("application/json")??false;
  if(isJson)return {isJson,payload:await request.json()};
  const form=await request.formData();
  return {isJson,payload:{full_name:String(form.get("full_name")||""),email:String(form.get("email")||""),password:String(form.get("password")||"")}};
}

export async function POST(request:Request){
  const {isJson,payload}=await registration(request);
  let response:Response;
  try {
    response=await fetch(`${backend}/api/v1/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
  } catch {
    return NextResponse.json({detail:"سرویس ثبت‌نام در دسترس نیست. ابتدا بک‌اند را اجرا کنید."},{status:503});
  }
  const data=await response.json();
  if(!response.ok)return NextResponse.json(data,{status:response.status});

  let login:Response;
  try {
    login=await fetch(`${backend}/api/v1/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:payload.email,password:payload.password}),cache:"no-store"});
  } catch {
    return NextResponse.json({detail:"ثبت‌نام انجام شد، اما ورود خودکار در دسترس نیست."},{status:503});
  }
  const session=await login.json();
  if(!login.ok)return NextResponse.json(session,{status:login.status});

  const result=isJson?NextResponse.json(data,{status:201}):NextResponse.redirect(new URL("/dashboard",request.url),303);
  const secureCookie=request.headers.get("x-forwarded-proto")==="https"||new URL(request.url).protocol==="https:";
  result.cookies.set("access_token",session.access_token,{httpOnly:true,sameSite:"lax",secure:secureCookie,path:"/",maxAge:30*60});
  return result;
}
