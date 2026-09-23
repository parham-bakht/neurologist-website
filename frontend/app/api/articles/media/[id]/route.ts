import {authorizedBackend,backendJson} from "../../../../../lib/server/backend";

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  return backendJson(await authorizedBackend(`/api/v1/articles/media/${(await params).id}`,{method:"DELETE"}));
}
