import {cookies} from "next/headers";
import {NextResponse} from "next/server";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const token=(await cookies()).get("access_token")?.value;
  if(!token)return NextResponse.json({detail:"Unauthorized"},{status:401});
  const {id}=await params;
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/patients/${id}/visits`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:await request.text()});
  return NextResponse.json(await response.json(),{status:response.status});
}
