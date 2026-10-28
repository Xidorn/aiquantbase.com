/* Deterministic calculations; no network requests and no data persistence. */
(function(root){
'use strict';
function fail(code){throw new Error(code);}
function number(value,positive){const n=Number(value);if(String(value).trim()===''||!Number.isFinite(n)||Math.abs(n)>1e12||(positive?n<=0:n<0))fail('number');return n;}
const Calc={
 position(v){const equity=number(v.equity,true),risk=number(v.risk,true),entry=number(v.entry,true),stop=number(v.stop,true);if(risk>100)fail('risk');if(stop>=entry)fail('stop');const budget=equity*risk/100;const units=Math.floor(Math.min(budget/(entry-stop),equity/entry));if(!Number.isSafeInteger(units))fail('quantity');return {value:units,budget,loss:units*(entry-stop),notional:units*entry};},
 drawdown(v){const raw=String(v.sequence||'').trim();if(!raw)fail('sequence');const tokens=raw.split(/[\s,，;；]+/).filter(Boolean);if(tokens.length<2||tokens.length>5000)fail('sequence');const values=tokens.map(x=>number(x,true));let peak=values[0],peakAt=0,max=0,from=0,to=0;const dd=[];for(let i=0;i<values.length;i++){if(values[i]>peak){peak=values[i];peakAt=i;}const d=1-values[i]/peak;dd.push(d);if(d>max){max=d;from=peakAt;to=i;}}return {value:max*100,from:from+1,to:to+1,peak:values[from],trough:values[to],values,dd};},
 cost(v){const buy=number(v.buy,true),sell=number(v.sell,true),fee=number(v.fee,false),slip=number(v.slip,false);if(fee>100||slip>100)fail('rate');const value=(buy+sell)*(fee+slip)/100;return {value,gross:sell-buy,net:sell-buy-value};},
 breakeven(v){const win=number(v.win,true),loss=number(v.loss,true),cost=number(v.cost,false);return {value:(loss+cost)/(win+loss)*100,possible:cost<=win};},
 cagr(v){const start=number(v.start,true),end=number(v.end,true),days=number(v.days,true);if(days<1)fail('days');const total=(end/start-1)*100;const value=Math.expm1(Math.log(end/start)/(days/365))*100;if(!Number.isFinite(value)||Math.abs(value)>1e15)fail('overflow');return {value,total,years:days/365};}
};
root.AQBCalc=Calc;
if(typeof module!=='undefined'&&module.exports)module.exports=Calc;
})(typeof window!=='undefined'?window:globalThis);
