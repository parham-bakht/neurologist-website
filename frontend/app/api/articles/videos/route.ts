import {authorizedBackend,backendJson} from "../../../../lib/server/backend";

export const runtime="nodejs";
export async function POST(request:Request){
  return backendJson(await authorizedBackend("/api/v1/uploads/videos",{method:"POST",body:await request.formData()}));
}
