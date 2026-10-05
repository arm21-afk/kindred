import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export function validate(body) {
  if (!body || !['interview','everyday','presentation'].includes(body.scenario)) throw new Error('Choose a practice scenario.');
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 24) throw new Error('Start a new session after 12 exchanges.');
  if (body.messages.some((m,i) => !m || m.role !== (i%2===0?'user':'assistant') || typeof m.content !== 'string' || !m.content.trim() || m.content.length>4000) || body.messages.at(-1).role!=='user') throw new Error('Invalid conversation. Keep each answer under 4,000 characters.');
  return body;
}
export function createServer({fetcher=fetch, model=process.env.OLLAMA_MODEL || 'qwen3:4b'}={}) {
  const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  return http.createServer(async(req,res)=>{
    if (!['127.0.0.1','localhost'].includes((req.headers.host||'').split(':')[0])) return send(res,403,{error:'Local access only.'});
    if(req.method==='GET' && req.url==='/') {
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});
      return res.end(await readFile(new URL('./index.html',import.meta.url)));
    }
    if(req.method==='GET' && req.url==='/api/status') {
      try {const r=await fetcher('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(3000)});if(!r.ok)throw Error();const data=await r.json();return send(res,200,{ready:data.models?.some(m=>m.name===model) || false,model});}catch{return send(res,200,{ready:false,model});}
    }
    if(req.method!=='POST'||req.url!=='/api/chat') return send(res,404,{error:'Not found'});
    if(req.headers.origin && ![`http://${req.headers.host}`].includes(req.headers.origin)) return send(res,403,{error:'Invalid origin'});
    let body;
    try {let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>110000)throw Error('Request too large.');}body=validate(JSON.parse(raw));}catch(e){return send(res,400,{error:e.message});}
    const prompt=`You are Kindred, a patient English practice partner. Scenario: ${body.scenario}. Treat the first user message as setup and ask an opening question. For subsequent answers, give one specific positive observation, one gentle correction with an improved sentence when useful, and one short follow-up question. Use plain English, under 150 words. Do not invent mistakes. No scores, shame, or claims about hiring outcomes. Stay in the selected practice scenario.`;
    try {
      const r=await fetcher('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,think:false,messages:[{role:'system',content:prompt},...body.messages],options:{temperature:0.6,num_predict:500}}),signal:AbortSignal.timeout(120000)});
      if(!r.ok)throw Error('Model unavailable');const data=await r.json();if(!data.message?.content?.trim())throw Error('Empty response');send(res,200,{reply:data.message.content});
    }catch{send(res,503,{error:'Could not reach your local model. Start Ollama and run: ollama pull '+model+'. Then retry. The first reply may take longer while the model loads.'});}
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)) createServer().listen(3000,'127.0.0.1',()=>console.log('Kindred: http://127.0.0.1:3000'));
