import {cookies} from "next/headers";
import {NextResponse} from "next/server";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const token=(await cookies()).get("access_token")?.value;
  if(!token)return NextResponse.json({detail:"Unauthorized"},{status:401});
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/contact-requests/${(await params).id}`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:await request.text()});
  return NextResponse.json(await response.json(),{status:response.status});
}
