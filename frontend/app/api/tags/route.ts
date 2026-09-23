import {authorizedBackend,backendJson} from "../../../lib/server/backend";

export async function GET(request:Request){
  const search=new URL(request.url).searchParams.get("search")||"";
  return backendJson(await authorizedBackend(`/api/v1/tags?search=${encodeURIComponent(search)}`));
}
export async function POST(request:Request){
  return backendJson(await authorizedBackend("/api/v1/tags",{method:"POST",headers:{"Content-Type":"application/json"},body:await request.text()}));
}
