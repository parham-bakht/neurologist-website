import {cookies} from "next/headers";
import {NextResponse} from "next/server";
const backend=process.env.BACKEND_URL||"http://localhost:8000";

export async function POST(request:Request){
  const response=await fetch(`${backend}/api/v1/contact-requests`,{method:"POST",headers:{"Content-Type":"application/json"},body:await request.text()});
  return NextResponse.json(await response.json(),{status:response.status});
}

export async function GET(){
  const token=(await cookies()).get("access_token")?.value;
  if(!token)return NextResponse.json({detail:"Unauthorized"},{status:401});
  const response=await fetch(`${backend}/api/v1/contact-requests`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
  return NextResponse.json(await response.json(),{status:response.status});
}
