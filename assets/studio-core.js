/* AI Quant Base Studio — deterministic, local research utilities. */
(function(root){
'use strict';
const VERSION='1.0.0',MAX_ROWS=5000,MAX_TEXT=500000;
function fail(code,row){const e=new Error(code);if(row)e.row=row;throw e;}
function parseCSV(text){
 if(typeof text!=='string'||text.length>MAX_TEXT)fail('file_size');
 text=text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();if(!text)fail('empty');
 const rows=[];let row=[],field='',quoted=false,closed=false;
 function cell(){row.push(field.trim());field='';closed=false;}
 function line(){cell();rows.push(row);row=[];if(rows.length>MAX_ROWS+1)fail('row_count');}
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c===','){cell();continue;}if(c==='\n'){line();continue;}
  if(closed){if(c===' '||c==='\t')continue;fail('csv');}
  if(c==='"'){if(field.trim())fail('csv');field='';quoted=true;continue;}field+=c;
 }
 if(quoted)fail('csv');line();return rows;
}
function validDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail('date');
 const [y,m,d]=value.split('-').map(Number);if(y<1900||y>9999)fail('date');const stamp=Date.UTC(y,m-1,d),dt=new Date(stamp);
 if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)fail('date');return stamp;
}
function observations(text){
 const csv=parseCSV(text);if(csv[0].length!==2||csv[0][0].toLowerCase()!=='date'||csv[0][1].toLowerCase()!=='equity')fail('header');
 if(csv.length<3)fail('row_count');let previous=-Infinity;
 return csv.slice(1).map((r,i)=>{try{if(r.length!==2)fail('columns');const date=r[0],stamp=validDate(date);if(stamp<=previous)fail(stamp===previous?'duplicate':'order');previous=stamp;
  if(!/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(r[1]))fail('equity');const equity=Number(r[1]);if(!Number.isFinite(equity)||equity<1e-12||equity>1e12)fail('equity');return {date,stamp,equity};
 }catch(e){e.row=i+2;throw e;}});
}
function analyze(text,basis,costBasis){
 if(!['no_flows','adjusted'].includes(basis))fail('flows');
 if(!['net','gross','unknown'].includes(costBasis))fail('cost_basis');
 const values=observations(text);let peak=values[0].equity,peakAt=0,max=0,from=0,to=0;const drawdowns=[],intervals=new Set();
 values.forEach((p,i)=>{if(p.equity>peak){peak=p.equity;peakAt=i;}const dd=1-p.equity/peak;drawdowns.push(dd);if(dd>max){max=dd;from=peakAt;to=i;}if(i)intervals.add((p.stamp-values[i-1].stamp)/86400000);});
 const first=values[0],last=values[values.length-1],days=(last.stamp-first.stamp)/86400000,change=(last.equity/first.equity-1)*100;
 const annual=Math.expm1((Math.log(last.equity)-Math.log(first.equity))*365/days)*100;
 return {schema:'aiquantbase.equity-report.v1',calculation_version:VERSION,basis,cost_basis:costBasis,observations:values.map(({date,equity})=>({date,equity})),metrics:{count:values.length,start:first.date,end:last.date,days,total_change_pct:change,cagr_pct:Number.isFinite(annual)&&Math.abs(annual)<=1e12?annual:null,max_drawdown_pct:max*100,peak_date:max?values[from].date:null,trough_date:max?values[to].date:null,irregular_intervals:intervals.size>1},drawdowns};
}
const fields=['title','universe','frequency','signal','execution','exit','sizing','costs','validation'];
function strategy(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('strategy');const out={};
 for(const k of fields){if(typeof input[k]!=='string'||!input[k].trim()||input[k].length>2000)fail('strategy');out[k]=input[k].trim();}
 if(!['custom','trend','mean','rotation'].includes(input.template))fail('strategy');
 return {schema:'aiquantbase.strategy-brief.v1',tool_version:VERSION,template:input.template,fields:out};
}
function importBrief(text){
 if(typeof text!=='string'||text.length>MAX_TEXT)fail('file_size');let o;try{o=JSON.parse(text);}catch{fail('json');}
 if(o?.schema!=='aiquantbase.strategy-brief.v1')fail('schema');return strategy({...o.fields,template:o.template});
}
function importReport(text){
 if(typeof text!=='string'||text.length>MAX_TEXT)fail('file_size');let o;try{o=JSON.parse(text);}catch{fail('json');}
 if(o?.schema!=='aiquantbase.equity-report.v1'||!Array.isArray(o.observations)||o.observations.length<2||o.observations.length>MAX_ROWS)fail('schema');
 const csv='date,equity\n'+o.observations.map(p=>{if(!p||typeof p.date!=='string'||typeof p.equity!=='number'||!Number.isFinite(p.equity))fail('schema');validDate(p.date);return p.date+','+p.equity;}).join('\n');
 return {csv,report:analyze(csv,o.basis,o.cost_basis)};
}
const api={VERSION,MAX_ROWS,MAX_TEXT,fields,parseCSV,observations,analyze,strategy,importBrief,importReport};root.AQBStudio=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
