import {authorizedBackend,backendJson} from "../../../../lib/server/backend";

export async function PATCH(request:Request){
  return backendJson(await authorizedBackend("/api/v1/auth/me",{
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:await request.text(),
  }));
}
