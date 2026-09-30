import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {authorizedBackend,backendJson} from "../../../../lib/server/backend";

export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
  const token=(await cookies()).get("access_token")?.value;
  if(!token)return NextResponse.json({detail:"Unauthorized"},{status:401});
  const {id}=await params;
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/visits/${id}`,{
    method:"PUT",
    headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
    body:await request.text(),
  });
  return NextResponse.json(await response.json(),{status:response.status});
}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  return backendJson(await authorizedBackend(`/api/v1/visits/${(await params).id}`,{method:"DELETE"}));
}
