import {authorizedBackend,backendJson} from "../../../../lib/server/backend";

type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){
  return backendJson(await authorizedBackend(`/api/v1/articles/manage/${(await params).id}`));
}
export async function PATCH(request:Request,{params}:Context){
  return backendJson(await authorizedBackend(`/api/v1/articles/${(await params).id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:await request.text()}));
}
export async function DELETE(_request:Request,{params}:Context){
  return backendJson(await authorizedBackend(`/api/v1/articles/${(await params).id}`,{method:"DELETE"}));
}
