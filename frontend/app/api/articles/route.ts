import {authorizedBackend,backendJson} from "../../../lib/server/backend";

export async function POST(request:Request){
  return backendJson(await authorizedBackend("/api/v1/articles",{method:"POST",headers:{"Content-Type":"application/json"},body:await request.text()}));
}
