import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { accountFromSession, loadRegistry } from "./_workspace.mjs";
import { json, readJsonBody, sameOrigin, sessionDetails } from "./_auth.mjs";

const decode=value=>String(value||"").replace(/<[^>]*>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&#(\d+);/g,(_,code)=>String.fromCharCode(Number(code))).replace(/\s+/g," ").trim();
const match=(html,pattern)=>decode(html.match(pattern)?.[1]||"");
function privateAddress(address){
  const value=String(address||"").toLowerCase().replace(/^\[|\]$/g,"");
  if(value.startsWith("::ffff:")){const mapped=value.slice(7);if(mapped.includes("."))return privateAddress(mapped);const words=mapped.split(":");if(words.length===2){const high=parseInt(words[0],16),low=parseInt(words[1],16);if(Number.isFinite(high)&&Number.isFinite(low))return privateAddress(`${high>>8}.${high&255}.${low>>8}.${low&255}`);}}
  if(value==="::"||value==="::1"||value==="0.0.0.0"||value.startsWith("fc")||value.startsWith("fd")||/^fe[89ab]/.test(value))return true;
  const parts=value.split(".").map(Number);if(parts.length!==4||parts.some(Number.isNaN))return false;
  return parts[0]===10||parts[0]===127||parts[0]===0||parts[0]===169&&parts[1]===254||parts[0]===172&&parts[1]>=16&&parts[1]<=31||parts[0]===192&&parts[1]===168||parts[0]===100&&parts[1]>=64&&parts[1]<=127||parts[0]===198&&(parts[1]===18||parts[1]===19)||parts[0]>=224;
}
async function safeUrl(input){
  let url;try{url=new URL(String(input||"").trim());}catch{throw new Error("Enter a complete http or https link.");}
  if(!["http:","https:"].includes(url.protocol)||url.username||url.password||String(input).length>2048)throw new Error("That link cannot be opened safely.");
  const host=url.hostname.toLowerCase().replace(/^\[|\]$/g,"");if(host==="localhost"||host.endsWith(".local")||host.endsWith(".internal"))throw new Error("Local network links cannot be opened.");
  const addresses=isIP(host)?[{address:host}]:await lookup(host,{all:true});if(!addresses.length||addresses.some(item=>privateAddress(item.address)))throw new Error("Private network links cannot be opened.");
  return url;
}
async function fetchPage(initial){
  let url=await safeUrl(initial);
  for(let turn=0;turn<4;turn++){
    const response=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(9000),headers:{"user-agent":"LifeCommandCenter/1.0 link preview","accept":"text/html,text/plain;q=0.9"}});
    if(response.status>=300&&response.status<400&&response.headers.get("location")){url=await safeUrl(new URL(response.headers.get("location"),url).href);continue;}
    if(!response.ok)throw new Error(`The link returned ${response.status}.`);
    const type=(response.headers.get("content-type")||"").toLowerCase(),length=Number(response.headers.get("content-length")||0);if(length>1_500_000)throw new Error("That page is too large to analyze.");if(!type.includes("text/html")&&!type.includes("text/plain"))throw new Error("This link is not a readable webpage.");
    const reader=response.body?.getReader();let received=0,chunks=[];while(reader){const {done,value}=await reader.read();if(done)break;received+=value.byteLength;if(received>1_500_000){await reader.cancel();throw new Error("That page is too large to analyze.");}chunks.push(value);}const bytes=new Uint8Array(received);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return {url:url.href,html:new TextDecoder().decode(bytes)};
  }
  throw new Error("The link redirected too many times.");
}
function pageDetails(url,html){
  const plain=/^\s*</.test(html),title=plain?(match(html,/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)||match(html,/<title[^>]*>([\s\S]*?)<\/title>/i)||match(html,/<h1[^>]*>([\s\S]*?)<\/h1>/i)):"Shared text";
  const description=plain?(match(html,/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["'][^>]*>/i)||match(html,/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i)):decode(html.slice(0,1200));
  const lines=plain?[...html.matchAll(/<(?:h1|h2|h3|li|p)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|li|p)>/gi)].map(item=>decode(item[1])).filter(text=>text.length>=12&&text.length<=260):html.split(/\r?\n/).map(decode).filter(Boolean);
  const unique=[...new Set(lines)].slice(0,40),host=new URL(url).hostname.replace(/^www\./,"");
  return {url,title:title||host,description,text:unique.join("\n").slice(0,7000),siteName:host};
}

export default async function handler(request,response){
  if(request.method!=="POST")return json(response,{error:"Method not allowed"},405);if(!sameOrigin(request))return json(response,{error:"Origin rejected"},403);
  const session=sessionDetails(request);if(!session)return json(response,{error:"Sign in required"},401);
  try{const {registry}=await loadRegistry(),resolved=session.legacy?{account:registry.accounts.owner,workspace:registry.workspaces.owner}:accountFromSession(registry,session);if(!resolved)return json(response,{error:"This session is no longer active"},401);const body=await readJsonBody(request),page=await fetchPage(body?.url);return json(response,{ok:true,source:pageDetails(page.url,page.html)});}catch(error){return json(response,{error:error.message||"The link could not be analyzed"},400);}
}
