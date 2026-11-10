// Read-only check: the projected arrows remain ten CSS pixels from their own edges.
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base=process.env.SMOKE_URL || 'http://localhost:5173';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});try{
 const c=await b.newContext();const deck=JSON.parse(require('fs').readFileSync('src/decks/data/year7-rectilinear-area.json','utf8'));await c.route('**/api/decks*',route=>new URL(route.request().url()).searchParams.get('id')===deck.id?route.fulfill({json:deck}):route.continue());await c.addInitScript(()=>localStorage.setItem('mt-dev-mode','1'));const p=await c.newPage();
 for(const [width,height] of [[1366,900],[820,1180],[390,844]])for(const slide of [4,9,14]){
  await p.setViewportSize({width,height});await p.goto(base+'/decks/year7-rectilinear-area?s='+slide);
  await p.locator('svg[data-dimension-diagram]').first().waitFor();
  const measure=()=>[...document.querySelectorAll('svg[data-dimension-diagram]')].flatMap(svg=>{const matrix=svg.getScreenCTM();if(!matrix)return[];return[...svg.querySelectorAll('[data-source][data-arrow]')].map(g=>{const s=g.dataset.source.split(',').map(Number),a=g.dataset.arrow.split(',').map(Number);const start=new DOMPoint(s[0],s[1]).matrixTransform(matrix),end=new DOMPoint(s[2],s[3]).matrixTransform(matrix),arrow=new DOMPoint(a[0],a[1]).matrixTransform(matrix);return Math.abs((end.x-start.x)*(arrow.y-start.y)-(end.y-start.y)*(arrow.x-start.x))/Math.hypot(end.x-start.x,end.y-start.y);});});
  await p.waitForFunction(measure.toString()+';');
  for(const stage of ['question','working']){
   if(stage==='working')await p.getByRole('button',{name:'Show working',exact:true}).click();
   await p.waitForFunction('('+measure.toString()+')().length > 0 && ('+measure.toString()+')().every(n=>Math.abs(n-10)<.15)',{},{timeout:20000});
   const gaps=await p.evaluate(measure);console.log(width,slide,stage,gaps.length,'arrows',Math.min(...gaps).toFixed(3),Math.max(...gaps).toFixed(3),'CSS px');
  }
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
