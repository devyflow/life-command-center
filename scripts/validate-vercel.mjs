import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import accounts from "../api/accounts.mjs";
import captureSource from "../api/capture-source.mjs";
import page from "../api/page.mjs";
import session from "../api/session.mjs";
import stateHandler from "../api/state.mjs";
import unlock from "../api/unlock.mjs";

process.env.ACCESS_SECRET = "test-secret";
process.env.UPSTREAM_URL = "https://upstream.test";
let upstream = { state:{ tasks:[{ id:1, title:"Owner task" }], paper:{} }, revision:7, updatedAt:"2026-01-01T00:00:00.000Z" };
global.fetch = async (input, options={}) => {
  const url=String(input);
  if(url.endsWith("/api/unlock"))return new Response(JSON.stringify({ok:true}),{status:200,headers:{"set-cookie":"life_command_access=service; Path=/"}});
  if(url.endsWith("/api/state")&&options.method==="PUT"){
    const body=JSON.parse(options.body);if(Number(body.baseRevision)!==upstream.revision)return new Response(JSON.stringify({error:"revision_conflict",...upstream}),{status:409,headers:{"content-type":"application/json"}});
    upstream={state:body.state,revision:upstream.revision+1,updatedAt:new Date().toISOString()};return new Response(JSON.stringify({ok:true,revision:upstream.revision,updatedAt:upstream.updatedAt}),{status:200,headers:{"content-type":"application/json"}});
  }
  if(url.endsWith("/api/state"))return new Response(JSON.stringify(upstream),{status:200,headers:{"content-type":"application/json"}});
  if(url.startsWith("https://93.184.216.34/"))return new Response('<html><head><title>Graph Practice Guide</title><meta name="description" content="A practical tutorial for learning graph algorithms"></head><body><h1>Graph Practice Guide</h1><p>Practice two graph problems and review the solutions.</p><li>Build a reusable BFS template</li></body></html>',{status:200,headers:{"content-type":"text/html"}});
  throw new Error("Unexpected fetch "+url);
};

function response(){return{statusCode:200,headers:{},body:"",setHeader(key,value){this.headers[key.toLowerCase()]=value;},end(value=""){this.body=String(value);}};}
function request(method="GET",headers={},body=undefined){const req=new EventEmitter();req.method=method;req.headers=headers;req.body=body;req[Symbol.asyncIterator]=async function*(){if(typeof body==="string")yield Buffer.from(body);};return req;}
const secureHeaders={host:"example.test",origin:"https://example.test","x-forwarded-proto":"https"};
const post=value=>request("POST",secureHeaders,value);
const json=response=>JSON.parse(response.body);
const postWithCookie=(cookie,value)=>request("POST",{...secureHeaders,cookie},value);

const locked=response();page(request(),locked);assert.match(locked.body,/Open your command center/);
const denied=response();await unlock(post({accessId:"owner",password:"wrong"}),denied);assert.equal(denied.statusCode,401);
const unlocked=response();await unlock(post({accessId:"owner",password:"test-secret",stayLoggedIn:true}),unlocked);assert.equal(unlocked.statusCode,200);
assert.match(unlocked.headers["set-cookie"],/Max-Age=31536000/);assert.match(unlocked.headers["set-cookie"],/SameSite=Lax/);assert.match(unlocked.headers["set-cookie"],/Priority=High/);
const ownerCookie=unlocked.headers["set-cookie"].split(";")[0];
const authorized=response();await session(request("GET",{cookie:ownerCookie}),authorized);assert.equal(authorized.statusCode,200);assert.equal(json(authorized).user.role,"owner");assert.match(authorized.headers["set-cookie"],/Max-Age=31536000/);
const ownerState=response();await stateHandler(request("GET",{cookie:ownerCookie}),ownerState);assert.equal(json(ownerState).state.tasks[0].title,"Owner task");
const sourcePreview=response();await captureSource(postWithCookie(ownerCookie,{url:"https://93.184.216.34/guide"}),sourcePreview);assert.equal(sourcePreview.statusCode,200);assert.equal(json(sourcePreview).source.title,"Graph Practice Guide");assert.match(json(sourcePreview).source.text,/Practice two graph problems/);
const privateSource=response();await captureSource(postWithCookie(ownerCookie,{url:"http://127.0.0.1/private"}),privateSource);assert.equal(privateSource.statusCode,400);
const privateIpv6=response();await captureSource(postWithCookie(ownerCookie,{url:"http://[::1]/private"}),privateIpv6);assert.equal(privateIpv6.statusCode,400);

const invite=response();await accounts(postWithCookie(ownerCookie,{action:"create_invite",displayName:"Test Friend"}),invite);assert.equal(invite.statusCode,200);const inviteToken=json(invite).token;assert.ok(inviteToken);
const activated=response();await unlock(post({inviteToken,displayName:"Test Friend",password:"river-calm-focus-2048",ownerAccess:true,stayLoggedIn:true}),activated);assert.equal(activated.statusCode,200);const activationBody=json(activated),testerAccessId=activationBody.account.accessId,testerCookie=activated.headers["set-cookie"].split(";")[0];assert.notEqual(testerAccessId,"owner");assert.equal(activationBody.recoveryCodes.length,8);
const emptyTester=response();await stateHandler(request("GET",{cookie:testerCookie}),emptyTester);assert.equal(json(emptyTester).state,null);
const saveTester=response();await stateHandler(request("PUT",{...secureHeaders,cookie:testerCookie},{state:{tasks:[{id:2,title:"Tester task"}],paper:{}},baseRevision:0}),saveTester);assert.equal(saveTester.statusCode,200);
const ownerStill=response();await stateHandler(request("GET",{cookie:ownerCookie}),ownerStill);assert.equal(json(ownerStill).state.tasks[0].title,"Owner task");

const accountList=response();await accounts(request("GET",{cookie:ownerCookie}),accountList);const tester=json(accountList).testers[0];assert.equal(tester.accessId,testerAccessId);
const switched=response();await accounts(postWithCookie(ownerCookie,{action:"switch_workspace",workspaceId:tester.workspaceId}),switched);assert.equal(switched.statusCode,200);const switchedCookie=switched.headers["set-cookie"].split(";")[0];
const testerViaOwner=response();await stateHandler(request("GET",{cookie:switchedCookie}),testerViaOwner);assert.equal(json(testerViaOwner).state.tasks[0].title,"Tester task");
const revokeSupport=response();await accounts(postWithCookie(testerCookie,{action:"owner_access",allowed:false}),revokeSupport);assert.equal(revokeSupport.statusCode,200);
const ownerBlocked=response();await stateHandler(request("GET",{cookie:switchedCookie}),ownerBlocked);assert.equal(ownerBlocked.statusCode,401);
const returned=response();await accounts(postWithCookie(switchedCookie,{action:"return_owner"}),returned);assert.equal(returned.statusCode,200);const returnedCookie=returned.headers["set-cookie"].split(";")[0];
const ownerAfterReturn=response();await stateHandler(request("GET",{cookie:returnedCookie}),ownerAfterReturn);assert.equal(json(ownerAfterReturn).state.tasks[0].title,"Owner task");

const createBackup=response();await accounts(postWithCookie(returnedCookie,{action:"create_backup",label:"Before test restore"}),createBackup);assert.equal(createBackup.statusCode,200);
const securityPanel=response();await accounts(request("GET",{cookie:returnedCookie}),securityPanel);assert.equal(securityPanel.statusCode,200);assert.ok(json(securityPanel).sessions.length);assert.ok(json(securityPanel).backups.length);assert.equal(json(securityPanel).health.status,"healthy");
const makeOwnerCodes=response();await accounts(postWithCookie(returnedCookie,{action:"generate_recovery_codes",currentPassword:"test-secret"}),makeOwnerCodes);assert.equal(makeOwnerCodes.statusCode,200);const ownerCodes=json(makeOwnerCodes).codes;assert.equal(ownerCodes.length,8);
const recovered=response();await unlock(post({recover:true,accessId:"owner",recoveryCode:ownerCodes[0],password:"new-owner-passphrase",stayLoggedIn:true}),recovered);assert.equal(recovered.statusCode,200);const recoveredCookie=recovered.headers["set-cookie"].split(";")[0];
const recoveredSession=response();await session(request("GET",{cookie:recoveredCookie}),recoveredSession);assert.equal(recoveredSession.statusCode,200);
const reusedCode=response();await unlock(post({recover:true,accessId:"owner",recoveryCode:ownerCodes[0],password:"another-passphrase"}),reusedCode);assert.equal(reusedCode.statusCode,400);

const app=response();page(request("GET",{cookie:ownerCookie}),app);assert.match(app.body,/Life Command Center/);assert.match(app.body,/accountPanel/);assert.match(app.body,/workspaceBanner/);
const appSource=await readFile(resolve(import.meta.dirname,"../client/app.js"),"utf8");
for(const pattern of [/data-planner-time/,/exportBackup/,/prepareScanVariants/,/detectPageBounds/,/scanCandidatesFromResults/,/analyzeCaptureLink/,/buildSourceSuggestions/,/saveCaptureSourceToKnowledge/,/paperSafePosition/,/initBulletinBoard/,/openSharedLibraryCapture/,/renderAccountPanel/,/switchWorkspace/,/STORE_BASE/])assert.match(appSource,pattern);
for(const file of ["manifest.webmanifest","sw.js","icon-192.png","icon-512.png"])await access(resolve(import.meta.dirname,"../client",file));
console.log("Account isolation, invitations, owner support access, persistent sessions, cloud migration, app shell, planner, Paper, bulletin board, library, scanner, backups, and PWA validated");
