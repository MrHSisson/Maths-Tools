import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_PATH || '@playwright/test');
const browser = await chromium.launch({...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.route('**/api/decks*',r=>r.fulfill({status:503,body:'{}'}));
 await page.goto(`${process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5173'}/decks/estimation?edit=1&s=13`);
 await page.getByRole('button',{name:'Lesson thread',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Lesson thread',exact:true});
 const brief=(n)=>dialog.getByRole('textbox',{name:`Brief for slide ${n}`,exact:true});
 await expect(brief(13)).toHaveValue(/independent whole-number/);
 await expect(brief(1)).toHaveValue('');
 await brief(13).fill('A temporary cancelled brief');
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Lesson thread',exact:true}).click();
 await expect(brief(13)).toHaveValue(/independent whole-number/);
 await brief(13).fill('Level 1 whole numbers only; check five boards, then continue to decimals.');
 await brief(2).fill('Key skill: round first, then calculate.');
 await dialog.getByRole('button',{name:'Apply lesson thread'}).click();
 await page.reload();
 await page.getByRole('button',{name:'Lesson thread',exact:true}).click();
 await expect(brief(13)).toHaveValue('Level 1 whole numbers only; check five boards, then continue to decimals.');
 await expect(brief(2)).toHaveValue('Key skill: round first, then calculate.');
 for(const [width,height] of [[1366,768],[1024,768],[390,800]]) {
  await page.setViewportSize({width,height});
  await expect(dialog.getByRole('button',{name:'Apply lesson thread'})).toBeInViewport();
  await brief(20).scrollIntoViewIfNeeded();
  await expect(brief(20)).toBeInViewport();
  await page.screenshot({path:`/tmp/thread-${width}.png`});
 }
 await page.setViewportSize({width:1366,height:768});
 await page.keyboard.press('Escape');
 await page.locator('div[style*="cursor: move"]').first().dblclick();
 const gen=page.getByRole('dialog',{name:'Configure generator'});
 await expect(gen.getByRole('region',{name:'Slide brief'})).toContainText('check five boards');
 console.log('ok lesson thread Cancel, Apply, reload persistence, three viewports and generator context');
}finally{await browser.close()}
