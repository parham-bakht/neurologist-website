import {authorizedBackend,backendJson} from "../../../lib/server/backend";

export async function GET(){return backendJson(await authorizedBackend("/api/v1/categories"));}
