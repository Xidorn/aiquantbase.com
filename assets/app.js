(function(){
'use strict';
const lang=document.body.dataset.lang||'en',zh=lang==='zh';
const text=(en,cn)=>zh?cn:(window.AQBTranslate?window.AQBTranslate(en):en);
// Keep clean directory URLs for search and a direct-file fallback for local review.
if(location.protocol==='file:')document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(!/^(https?:|mailto:|tel:|#)/i.test(h)){const u=new URL(h,location.href);if(u.protocol==='file:'&&u.pathname.endsWith('/')){u.pathname+='index.html';a.href=u.href;}}});
const picker=document.querySelector('.language-picker');
document.addEventListener('click',e=>{if(picker&&!picker.contains(e.target))picker.open=false;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&picker)picker.open=false;});
const selectedTemplate=new URLSearchParams(location.search).get('template');
if(['trend','mean','rotation'].includes(selectedTemplate))document.querySelectorAll('.language-picker a').forEach(a=>{const u=new URL(a.href,location.href);u.searchParams.set('template',selectedTemplate);a.href=u.href;});
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}});
const dialog=document.querySelector('.search-dialog'),input=document.querySelector('#site-search'),results=document.querySelector('.search-results');
function renderSearch(){const q=input.value.trim().toLowerCase();const data=(window.AQB_SEARCH||[]).filter(p=>p.lang===lang);const matches=q?data.filter(p=>(p.title+' '+p.desc+' '+p.path).toLowerCase().includes(q)):data.filter(p=>p.path.startsWith('tools/')||p.path==='ai-quant/what-is-ai-quant-trading');results.replaceChildren();const status=document.createElement('p');status.className='search-status';status.textContent=q?text('Matching pages: ','匹配頁面：')+matches.length:text('Suggested starting points','建議從這裏開始');results.append(status);for(const p of matches.slice(0,30)){const a=document.createElement('a');a.className='search-item';a.href=document.body.dataset.root+(location.protocol==='file:'?p.file:p.file.replace(/index\.html$/,''));const b=document.createElement('b');b.textContent=p.title;const small=document.createElement('small');small.textContent=p.desc;a.append(b,small);results.append(a);}if(!matches.length){const p=document.createElement('p');p.textContent=text('Try a broader term, such as backtesting, costs or RSI.','可嘗試更寬泛的詞，例如回測、成本或 RSI。');results.append(p);}}
let opener;
document.querySelector('[data-search-open]')?.addEventListener('click',e=>{opener=e.currentTarget;dialog.showModal();renderSearch();input.focus();});
document.querySelector('[data-search-close]')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('close',()=>opener?.focus());
dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
input?.addEventListener('input',renderSearch);
const form=document.querySelector('[data-calculator]');if(!form)return;
const output=document.querySelector('[data-result-value]'),content=document.querySelector('[data-result-content]');
const fmt=(n,d=2)=>new Intl.NumberFormat(window.AQBLocale||(zh?'zh-Hant':'en-US'),{maximumFractionDigits:d,minimumFractionDigits:d}).format(n);
function line(s,cls='result-sub'){const p=document.createElement('p');p.className=cls;p.textContent=s;content.append(p);}
function chart(series){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 500 120');svg.setAttribute('role','img');svg.setAttribute('aria-label',text('Drawdown magnitude from your input sequence','根據輸入序列計算的回撤幅度'));svg.classList.add('result-chart');const max=Math.max(...series,.001),n=series.length;const pts=series.map((v,i)=>[10+i/(n-1)*480,12+v/max*90]);const path=document.createElementNS(ns,'path');path.setAttribute('d','M'+pts.map(p=>p.join(',')).join(' L'));path.setAttribute('stroke','#d8bd88');path.setAttribute('stroke-width','2');path.setAttribute('fill','none');const baseline=document.createElementNS(ns,'path');baseline.setAttribute('d','M10 12H490');baseline.setAttribute('stroke','#ffffff40');svg.append(baseline,path);content.append(svg);}
function calculate(){content.replaceChildren();try{const type=form.dataset.calculator,values=Object.fromEntries(new FormData(form)),r=window.AQBCalc[type](values);output.classList.remove('error');output.textContent=fmt(r.value,type==='position'?0:2)+(type==='drawdown'||type==='breakeven'||type==='cagr'?'%':'');
if(type==='position'){line(text('Whole units, subject to cash and risk limits','整數單位，同時受現金與風險預算限制'));line(text('Chosen risk budget: ','自定風險預算：')+fmt(r.budget));line(text('Modeled stop-distance loss: ','按止損距離計算的損失：')+fmt(r.loss));line(text('Purchase notional: ','買入金額：')+fmt(r.notional));if(!r.value)line(text('The inputs do not allow one whole unit.','當前輸入無法購買一個完整單位。'));}
if(type==='drawdown'){chart(r.dd);line(text('Peak at position ','峯值位置 ')+r.from+': '+fmt(r.peak));line(text('Trough at position ','低點位置 ')+r.to+': '+fmt(r.trough));line(text('Observations: ','觀察值：')+r.values.length+text('. Declines are shown as positive percentages.','。回撤採用正百分比。'));}
if(type==='cost'){line(text('Estimated total two-leg cost','兩次交易的估算總成本'));line(text('Gross P&L: ','未扣成本盈虧：')+fmt(r.gross));line(text('Net P&L: ','淨盈虧：')+fmt(r.net));}
if(type==='breakeven'){line(r.possible?text('Required win rate under your assumptions','給定假設下所需的盈虧平衡勝率'):text('Break-even is not attainable under these inputs, even with a 100% win rate.','這些輸入下即使勝率爲 100%，也無法達到盈虧平衡。'));}
if(type==='cagr'){line(text('Compound annual growth rate','複合年增長率'));line(text('Total change: ','期間總變化：')+fmt(r.total)+'%');line(text('Holding years (365-day basis): ','持有年數（365 天口徑）：')+fmt(r.years,4));}
}catch(e){output.textContent=text('Check inputs','請檢查輸入');output.classList.add('error');const messages={quantity:text('The unit count is too large for precise calculation. Check the price and account units.','數量過大，無法精確計算，請檢查價格及賬戶單位。'),number:text('Use finite positive values (or zero where permitted), no greater than 1 trillion.','請輸入有限的正數（允許時可輸入零），數值不超過一萬億。'),risk:text('Risk percentage must be greater than 0 and no more than 100.','風險比例應大於 0 且不超過 100。'),stop:text('For this long-only example, the stop must be below the entry price.','此工具用於做多示例，止損價需低於入場價。'),rate:text('Percentage rates must be between 0 and 100.','百分比費率應在 0 到 100 之間。'),sequence:text('Enter 2–5,000 positive values separated by commas, spaces or new lines.','請輸入 2—5,000 個正數，用逗號、空格或換行分隔。'),days:text('Holding period must be at least one day.','持有期至少爲一天。'),overflow:text('The annualized result is too large to display meaningfully. Check the period and values.','年化結果過大，請檢查持有期和數值。')};line(messages[e.message]||text('Please check the entered values.','請檢查輸入數值。'),'error');}}
form.addEventListener('submit',e=>{e.preventDefault();if(form.reportValidity())calculate();});
form.addEventListener('reset',()=>setTimeout(calculate,0));
form.addEventListener('input',()=>{output.textContent='—';content.replaceChildren();line(text('Inputs changed. Select Calculate to update the result.','輸入已改變，請點擊“開始計算”更新結果。'));});
calculate();
})();

/* Light visual enhancement. Content and navigation stay available without it. */
(function(){
'use strict';
if(document.querySelector('.prose')){const p=document.createElement('div');p.className='scroll-progress';p.setAttribute('aria-hidden','true');document.body.append(p);let ticking=false;const update=()=>{const h=document.documentElement.scrollHeight-window.innerHeight;p.style.transform='scaleX('+Math.max(0,Math.min(1,h?window.scrollY/h:0))+')';ticking=false;};window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true;}},{passive:true});update();}
})();

/* Accessible research navigation: content remains available without JavaScript. */
(function(){
'use strict';
const tabs=Array.from(document.querySelectorAll('[data-research-tab]'));
if(!tabs.length)return;
function select(tab,focus){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;const panel=document.getElementById(t.getAttribute('aria-controls'));panel.hidden=!active;});if(focus)tab.focus();}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(tab,false));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();select(tabs[next],true);}});});
select(tabs[0],false);
})();
