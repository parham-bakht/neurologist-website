import {cookies} from "next/headers";
import {NextResponse} from "next/server";

export async function POST(request:Request){
  const token=(await cookies()).get("access_token")?.value;
  if(!token)return NextResponse.json({detail:"Unauthorized"},{status:401});
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/patients`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:await request.text()});
  const data=await response.json();
  return NextResponse.json(data,{status:response.status});
}
