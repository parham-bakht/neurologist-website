import {authorizedBackend,backendJson} from "../../../../../../lib/server/backend";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){return backendJson(await authorizedBackend(`/api/v1/admin/users/${(await params).id}/role`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:await request.text()}));}
