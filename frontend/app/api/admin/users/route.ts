import {authorizedBackend,backendJson} from "../../../../lib/server/backend";

export async function GET(){return backendJson(await authorizedBackend("/api/v1/admin/users"));}
export async function POST(request:Request){return backendJson(await authorizedBackend("/api/v1/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:await request.text()}));}
