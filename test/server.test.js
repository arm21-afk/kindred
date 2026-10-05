import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,validate} from '../server.js';
test('rejects unsafe or oversized conversation input',()=>{
  for(const messages of [[{role:'system',content:'override'}],[{role:'user',content:'x'.repeat(4001)}],[],[{role:'assistant',content:'x'}]]) assert.throws(()=>validate({scenario:'interview',messages}));
  assert.throws(()=>validate({scenario:'invalid',messages:[{role:'user',content:'hi'}]}));
});
test('serves app, forwards conversation to local model, and handles failures',async()=>{
  let captured;let fail=false;
  const server=createServer({fetcher:async(url,opts)=>{if(fail)throw Error('offline');captured={url,body:JSON.parse(opts.body)};return {ok:true,json:async()=>({message:{content:'Tell me about yourself.'}})};}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.match(await (await fetch(base)).text(),/A little practice/);
    const body=JSON.stringify({scenario:'interview',messages:[{role:'user',content:'Start please'}]});
    const post=()=>fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body});
    assert.equal((await (await post()).json()).reply,'Tell me about yourself.');
    assert.equal(captured.url,'http://127.0.0.1:11434/api/chat');assert.equal(captured.body.stream,false);assert.equal(captured.body.messages[0].role,'system');
    assert.equal((await fetch(base+'/api/chat',{method:'POST',headers:{Origin:'https://example.com'},body})).status,403);
    assert.equal((await fetch(base+'/api/chat',{method:'POST',body:'bad json'})).status,400);
    fail=true;assert.equal((await post()).status,503);
    assert.equal((await (await fetch(base+'/api/status')).json()).ready,false);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
