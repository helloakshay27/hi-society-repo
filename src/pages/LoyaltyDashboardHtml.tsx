
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoyaltyDashboardHtml.css';

export const LoyaltyDashboardHtml = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    script.async = true;
    
    script.onload = () => {
      
'use strict';
Chart.defaults.font.family="'Poppins',sans-serif";
Chart.defaults.font.size=10;
const GR='rgba(196,184,157,.15)';
window.CI={};

/* ── CHART DATA ── */
window.CD={
  trend:{
    labels:['Jan','Feb','Mar','Apr','May','Jun'],
    multi:true,
    datasets:[
      {label:'Points Issued',data:[68400,74200,88600,101300,118400,124500],bg:'rgba(218,119,86,.25)',bc:'#DA7756',fill:true,tension:.4,pr:4},
      {label:'Points Redeemed',data:[12400,15800,21200,28400,34600,40800],bg:'rgba(8,80,65,.2)',bc:'#085041',fill:true,tension:.4,pr:4}
    ],h:false,def:'bar'
  },
  tiers:{labels:['Bronze','Silver','Gold'],values:[1420,1042,385],colors:['#C4B89D','#888780','#BA7517'],h:false,def:'doughnut'},
  rulecat:{labels:['Collections','Marketing','Possession','Sales','Referrals','App'],values:[4120,3200,2340,1650,890,780],
    colors:['#DA7756','#6B9BCC','#9EC8BA','#108C72','#EDC488','#798C5E'],h:false,def:'bar'},
  dailyfires:{
    labels:['13 Jun','14 Jun','15 Jun','16 Jun','17 Jun','18 Jun','19 Jun'],
    multi:true,
    datasets:[{label:'Rules Fired',data:[388,412,421,398,440,428,412],bg:'rgba(218,119,86,.2)',bc:'#DA7756',fill:true,tension:.4,pr:4}],
    h:false,def:'line'
  },
  tierdist:{labels:['Bronze','Silver','Gold'],values:[1420,1042,385],colors:['#C4B89D','#888780','#BA7517'],h:false,def:'doughnut'},
  newmem:{labels:['Jan','Feb','Mar','Apr','May','Jun'],values:[58,72,84,96,105,124],colors:['#DA7756'],h:false,def:'bar'},
  redtype:{labels:['Encashment','Vouchers','Merchandise','Travel','Experiences','Lounge'],
    values:[1240,680,420,280,180,112],
    colors:['#108C72','#DA7756','#6B9BCC','#9EC8BA','#EDC488','#798C5E'],h:false,def:'doughnut'},
  redtrend:{
    labels:['Jan','Feb','Mar','Apr','May','Jun'],
    multi:true,
    datasets:[
      {label:'Redemption Rate %',data:[8.4,11.2,14.8,17.6,20.4,23.4],bg:'rgba(8,80,65,.15)',bc:'#085041',fill:true,tension:.4,pr:4},
      {label:'Target 30%',data:[30,30,30,30,30,30],bg:'transparent',bc:'rgba(163,45,45,.4)',fill:false,tension:0,pr:0,dash:[4,3]}
    ],h:false,def:'line'
  },
  walletflow:{
    labels:['Jan','Feb','Mar','Apr','May','Jun'],
    multi:true,
    datasets:[
      {label:'Issued',data:[68400,74200,88600,101300,118400,124500],bg:'rgba(218,119,86,.6)',bc:'#DA7756',fill:false},
      {label:'Redeemed',data:[12400,15800,21200,28400,34600,40800],bg:'rgba(8,80,65,.6)',bc:'#085041',fill:false},
      {label:'Balance',data:[56000,114400,181800,254700,338500,422200],bg:'rgba(107,155,204,.3)',bc:'#6B9BCC',fill:false,tension:.3,pr:3}
    ],h:false,def:'bar'
  },
  orderage:{labels:['0-30d','31-60d','61-90d','90d+'],values:[38,7,0,7],
    colors:['#108C72','#108C72','#9EC8BA','#E7848E'],h:false,def:'bar'},
  orderstatus:{labels:['Fulfilled','Stuck — Paid, Pending'],values:[45,7],
    colors:['#108C72','#E7848E'],h:false,def:'doughnut'},
  funnel:{
    labels:['Merchandise','Lounge','Miles'],
    multi:true,
    datasets:[
      {label:'Available',data:[3165,62,8],bg:'#9EC8BA',bc:'#9EC8BA',fill:false},
      {label:'Added to Store',data:[0,0,0],bg:'#EDC488',bc:'#EDC488',fill:false},
      {label:'Redeemed',data:[0,0,0],bg:'#E7848E',bc:'#E7848E',fill:false}
    ],h:true,def:'bar'
  },
  catmix:{labels:['Merchandise (3,165)','Lounge (62)','Miles (8)'],values:[3165,62,8],
    colors:['#DA7756','#9EC8BA','#EDC488'],h:false,def:'doughnut'}
};

function bldOpts(type,cfg){
  const isDo=type==='doughnut',isLn=type==='line';
  return{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:isDo||(cfg.multi&&!isDo),position:'right',
      labels:{font:{size:9,family:"'Poppins',sans-serif"},boxWidth:8,padding:6,color:'#2C2C2C'}},
      tooltip:{titleFont:{size:11,family:"'Poppins',sans-serif"},bodyFont:{size:10,family:"'Poppins',sans-serif"}}},
    ...(isDo?{cutout:'65%'}:{indexAxis:cfg.h?'y':'x',
      scales:{x:{grid:{color:GR},ticks:{font:{size:9},color:'#798C5E'}},
              y:{grid:{color:GR},ticks:{font:{size:9},color:'#798C5E'}}}})};
}

function renderChart(id){
  const c=CD[id];const cv=document.getElementById('c-'+id);const td=document.getElementById('ct-'+id);
  if(!cv)return;if(CI[id]){CI[id].destroy();CI[id]=null;}
  const type=c.activeType||c.def;
  if(type==='tbl'){cv.style.display='none';if(td){td.style.display='block';td.innerHTML=buildTblHTML(c);}return;}
  cv.style.display='block';if(td)td.style.display='none';
  const ct=type==='doughnut'?'doughnut':type;
  let datasets;
  if(c.multi){
    datasets=c.datasets.map(d=>({label:d.label,data:d.data,backgroundColor:ct==='line'?d.bg:d.bg,
      borderColor:d.bc,fill:d.fill||false,tension:d.tension||0,pointRadius:d.pr!==undefined?d.pr:0,
      borderWidth:ct==='line'?2:0,borderRadius:ct==='bar'?4:0,borderDash:d.dash,
      ...(ct!=='line'&&{borderWidth:0,borderRadius:4})}));
  }else{
    const isDo=ct==='doughnut';
    datasets=[{data:c.values,backgroundColor:c.colors,borderWidth:isDo?2:0,borderRadius:ct==='bar'?4:0,
      borderColor:isDo?'#fff':undefined}];
  }
  CI[id]=new Chart(cv.getContext('2d'),{type:ct,data:{labels:c.labels,datasets},options:bldOpts(ct,c)});
}

function buildTblHTML(c){
  if(c.multi){
    let h='<table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr><th style="padding:4px 8px;border-bottom:1px solid #E0D8CC;background:#F6F4EE;text-align:left;font-family:Poppins,sans-serif">Period</th>';
    c.datasets.forEach(d=>{h+=`<th style="padding:4px 8px;border-bottom:1px solid #E0D8CC;background:#F6F4EE;text-align:right;font-family:Poppins,sans-serif">${d.label}</th>`;});
    h+='</tr></thead><tbody>';
    c.labels.forEach((l,i)=>{h+=`<tr><td style="padding:4px 8px;border-bottom:1px solid #E0D8CC">${l}</td>`;
      c.datasets.forEach(d=>{h+=`<td style="padding:4px 8px;border-bottom:1px solid #E0D8CC;text-align:right;font-weight:600">${d.data[i].toLocaleString()}</td>`;});
      h+='</tr>';});
    return h+'</tbody></table>';
  }else{
    let h='<table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr><th style="padding:4px 8px;border-bottom:1px solid #E0D8CC;background:#F6F4EE;text-align:left">Category</th><th style="padding:4px 8px;border-bottom:1px solid #E0D8CC;background:#F6F4EE;text-align:right">Value</th></tr></thead><tbody>';
    c.labels.forEach((l,i)=>{h+=`<tr><td style="padding:4px 8px;border-bottom:1px solid #E0D8CC">${l}</td><td style="padding:4px 8px;border-bottom:1px solid #E0D8CC;text-align:right;font-weight:600">${c.values[i].toLocaleString()}</td></tr>`;});
    return h+'</tbody></table>';
  }
}

window.switchChart = function switchChart(id,type,btn){
  CD[id].activeType=type;
  document.querySelectorAll(`[onclick^="switchChart('${id}"]`).forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderChart(id);
}

/* ── TABS ── */
window.switchTab = function switchTab(id,el){
  document.querySelectorAll('.tp').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tn').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  el.classList.add('active');
  setTimeout(()=>{ Object.keys(CD).forEach(cid=>{if(document.getElementById('c-'+cid))renderChart(cid);});},50);
}

/* ── DATE FILTER (topbar dropdown) ── */
window.dfActivePreset='thismonth';

window.toggleFilter = function toggleFilter(e){
  e.stopPropagation();
  document.getElementById('tbFilterDrop').classList.toggle('open');
}
document.addEventListener('click',function(e){
  const wrap=document.getElementById('tbFilterWrap');
  if(wrap&&!wrap.contains(e.target)){
    document.getElementById('tbFilterDrop').classList.remove('open');
  }
});
window.updateFilterLabel = function updateFilterLabel(label){
  document.getElementById('tbFilterLbl').textContent=label;
}

window.setDFMode = function setDFMode(mode,btn){
  document.querySelectorAll('.tfd-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('df-day-wrap').style.display=mode==='day'?'flex':'none';
  document.getElementById('df-month-wrap').style.display=mode==='month'?'flex':'none';
  document.getElementById('df-range-wrap').style.display=mode==='range'?'flex':'none';
  document.querySelectorAll('.tfd-preset').forEach(p=>p.classList.remove('active'));
  dfActivePreset=null;
}

window.setModeBtn = function setModeBtn(mode){
  const btns=document.querySelectorAll('.tfd-btn');
  ['day','month','range'].forEach((m,i)=>btns[i].classList.toggle('active',m===mode));
  document.getElementById('df-day-wrap').style.display=mode==='day'?'flex':'none';
  document.getElementById('df-month-wrap').style.display=mode==='month'?'flex':'none';
  document.getElementById('df-range-wrap').style.display=mode==='range'?'flex':'none';
}

window.applyDF = function applyDF(){
  const mode=document.querySelector('.tfd-btn.active')?.textContent.toLowerCase().trim()||'month';
  let label='';
  const fmt=v=>{if(!v)return'—';const d=new Date(v+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});};
  if(mode==='day'){
    label=fmt(document.getElementById('df-day-input').value);
  }else if(mode==='month'){
    const v=document.getElementById('df-month-input').value;
    if(v){const[y,m]=v.split('-');label=new Date(y,m-1).toLocaleDateString('en-GB',{month:'short',year:'numeric'});}
  }else{
    const f=document.getElementById('df-from-input').value;
    const t=document.getElementById('df-to-input').value;
    const s=v=>{if(!v)return'—';const d=new Date(v+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});};
    label=s(f)+' → '+s(t);
  }
  updateFilterLabel(label);
  document.getElementById('tbFilterDrop').classList.remove('open');
  showToast('Filter applied — '+label);
  syncNavLink();
}

window.resetDF = function resetDF(){
  setModeBtn('month');
  document.getElementById('df-month-input').value='2026-06';
  document.querySelectorAll('.tfd-preset').forEach(p=>p.classList.remove('active'));
  document.querySelector('.tfd-preset[onclick*="thismonth"]').classList.add('active');
  dfActivePreset='thismonth';
  updateFilterLabel('This Month');
  showToast('Reset — This Month · Jun 2026');
  syncNavLink();
}

window.setPreset = function setPreset(preset,btn){
  dfActivePreset=preset;
  document.querySelectorAll('.tfd-preset').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  const today=new Date('2026-06-19T12:00:00');
  const iso=d=>d.toISOString().split('T')[0];
  const mo=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  if(preset==='today'){
    setModeBtn('day');
    document.getElementById('df-day-input').value=iso(today);
    updateFilterLabel('Today');
    showToast('Today — 19 Jun 2026');
  }else if(preset==='7d'){
    const f=new Date(today);f.setDate(f.getDate()-6);
    setModeBtn('range');
    document.getElementById('df-from-input').value=iso(f);
    document.getElementById('df-to-input').value=iso(today);
    updateFilterLabel('Last 7 Days');
    showToast('Last 7 Days — 13–19 Jun 2026');
  }else if(preset==='30d'){
    const f=new Date(today);f.setDate(f.getDate()-29);
    setModeBtn('range');
    document.getElementById('df-from-input').value=iso(f);
    document.getElementById('df-to-input').value=iso(today);
    updateFilterLabel('Last 30 Days');
    showToast('Last 30 Days — 21 May – 19 Jun 2026');
  }else if(preset==='thismonth'){
    setModeBtn('month');
    document.getElementById('df-month-input').value=mo(today);
    updateFilterLabel('This Month');
    showToast('This Month — Jun 2026');
  }else if(preset==='lastmonth'){
    const lm=new Date(today.getFullYear(),today.getMonth()-1,1);
    setModeBtn('month');
    document.getElementById('df-month-input').value=mo(lm);
    updateFilterLabel('Last Month');
    showToast('Last Month — May 2026');
  }else if(preset==='thisquarter'){
    const qStart=new Date(today.getFullYear(),Math.floor(today.getMonth()/3)*3,1);
    setModeBtn('range');
    document.getElementById('df-from-input').value=iso(qStart);
    document.getElementById('df-to-input').value=iso(today);
    updateFilterLabel('This Quarter');
    showToast('This Quarter — Apr–Jun 2026');
  }
  syncNavLink();
}

/* ── CROSS-DASHBOARD FILTER SYNC ── */
const NAV_TARGET='loyalty_spoc_v4.html';
function currentFilterQuery(){
  const mode=document.querySelector('.tfd-btn.active')?.textContent.toLowerCase().trim()||'month';
  const p=new URLSearchParams();
  p.set('fmode',mode);
  if(mode==='day'){p.set('fday',document.getElementById('df-day-input').value);}
  else if(mode==='month'){p.set('fmonth',document.getElementById('df-month-input').value);}
  else{p.set('ffrom',document.getElementById('df-from-input').value);p.set('fto',document.getElementById('df-to-input').value);}
  return p.toString();
}
window.syncNavLink = function syncNavLink(){
  const a=document.querySelector('.tb-home');
  if(a)a.href=NAV_TARGET+'?'+currentFilterQuery();
}
window.applyIncomingFilter = function applyIncomingFilter(){
  const p=new URLSearchParams(window.location.search);
  const mode=p.get('fmode');
  if(!mode)return;
  if(mode==='day'&&p.get('fday')){setModeBtn('day');document.getElementById('df-day-input').value=p.get('fday');}
  else if(mode==='month'&&p.get('fmonth')){setModeBtn('month');document.getElementById('df-month-input').value=p.get('fmonth');}
  else if(mode==='range'&&p.get('ffrom')&&p.get('fto')){setModeBtn('range');document.getElementById('df-from-input').value=p.get('ffrom');document.getElementById('df-to-input').value=p.get('fto');}
  else return;
  let label='This Month';
  if(mode==='day'){const v=document.getElementById('df-day-input').value;if(v)label=new Date(v+'T12:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}
  else if(mode==='month'){const v=document.getElementById('df-month-input').value;if(v){const[y,m]=v.split('-');label=new Date(y,m-1).toLocaleDateString('en-GB',{month:'short',year:'numeric'});}}
  else{const f=document.getElementById('df-from-input').value,t=document.getElementById('df-to-input').value;const s=v=>v?new Date(v+'T12:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—';label=s(f)+' → '+s(t);}
  updateFilterLabel(label);
  document.querySelectorAll('.tfd-preset').forEach(p=>p.classList.remove('active'));
  dfActivePreset=null;
}
applyIncomingFilter();
syncNavLink();

/* ── DRILL PANEL ── */
window.DRILLS={
  'members-kpi':`<div class="dk-strip"><div class="dk"><div class="dk-val">2,847</div><div class="dk-lbl">Total Active</div></div><div class="dk"><div class="dk-val" style="color:#BA7517">385</div><div class="dk-lbl">Gold</div></div><div class="dk"><div class="dk-val" style="color:#888780">1,042</div><div class="dk-lbl">Silver</div></div><div class="dk"><div class="dk-val" style="color:#C4B89D">1,420</div><div class="dk-lbl">Bronze</div></div></div><div class="d-sl-lbl">Breakdown</div><div class="d-sl"><span>New this month</span><span style="color:#085041;font-weight:700">+124</span></div><div class="d-sl"><span>Lapsed (60+ days)</span><span style="color:#A32D2D;font-weight:700">318</span></div><div class="d-sl"><span>Avg points/member</span><span style="font-weight:600">226 pts</span></div>`,
  'expired-points':`<div class="dk-strip"><div class="dk"><div class="dk-val" style="color:#BA7517">0</div><div class="dk-lbl">Expired To Date</div></div><div class="dk"><div class="dk-val">6,45,100</div><div class="dk-lbl">Pts Outstanding</div></div><div class="dk"><div class="dk-val" style="color:#888780">—</div><div class="dk-lbl">Expiry Window</div></div></div><div class="d-sl-lbl">Why is this 0?</div><div style="padding:8px;background:#FFFAF0;border-radius:8px;border:1px solid #EDC48840;font-size:11px;line-height:1.6;color:var(--dark)">No points have expired yet, but that number isn't fully trustworthy until the expiry window for this programme is confirmed. If no expiry policy is configured on the platform, points simply never lapse — which is a different (and riskier) situation than a policy that hasn't caught up yet. This needs sign-off from the dev team, same as the expiry KPI on the Loyalty Dashboard.</div><div class="d-sl-lbl">Once confirmed, this panel will show</div><div class="d-sl"><span>Which members</span><span style="color:var(--sage)">Pending config</span></div><div class="d-sl"><span>Which month(s)</span><span style="color:var(--sage)">Pending config</span></div><div class="d-sl"><span>Reason</span><span style="color:var(--sage)">Window lapsed / no redemption option</span></div><button class="action-btn" onclick="showToast('Escalating expiry config confirmation')">📩 Confirm expiry window with dev team</button>`,
  'redemption-kpi':`<div class="dk-strip"><div class="dk"><div class="dk-val">23.4%</div><div class="dk-lbl">Rate</div></div><div class="dk"><div class="dk-val">2,912</div><div class="dk-lbl">Redemptions</div></div><div class="dk"><div class="dk-val">12,450</div><div class="dk-lbl">Eligible</div></div></div><div class="d-sl-lbl">Top Categories</div><div class="d-sl"><span>Encashment</span><span style="font-weight:700;color:#085041">1,240 (42.5%)</span></div><div class="d-sl"><span>Vouchers</span><span style="font-weight:600">680 (23.3%)</span></div><div class="d-sl"><span>Merchandise</span><span style="font-weight:600">420 (14.4%)</span></div>`,
  'lapsed':`<div class="dk-strip"><div class="dk"><div class="dk-val" style="color:#A32D2D">318</div><div class="dk-lbl">Lapsed Members</div></div><div class="dk"><div class="dk-val">60+</div><div class="dk-lbl">Days Inactive</div></div></div><div class="d-sl-lbl">Risk Breakdown</div><div class="d-sl"><span>Bronze tier (highest risk)</span><span style="color:#A32D2D;font-weight:700">224</span></div><div class="d-sl"><span>Silver tier</span><span style="color:#BA7517;font-weight:600">78</span></div><div class="d-sl"><span>Gold tier</span><span style="color:#085041;font-weight:600">16</span></div><div class="d-sl-lbl">Recommended Action</div><div style="padding:8px;background:#FFF5F5;border-radius:8px;border:1px solid rgba(163,44,44,.15);font-size:11px;line-height:1.5">Create a time-based re-engagement rule: award 200 bonus points if member opens the app within 7 days of notification. Estimated recovery: 40–60% of lapsed members.</div><button class="action-btn" onclick="showToast('Re-engagement rule builder opened')">⚙️ Create Re-engagement Rule</button>`,
  'rules-kpi':`<div class="dk-strip"><div class="dk"><div class="dk-val">34</div><div class="dk-lbl">Active Rules</div></div><div class="dk"><div class="dk-val" style="color:#BA7517">2</div><div class="dk-lbl">Paused</div></div><div class="dk"><div class="dk-val" style="color:#888780">1</div><div class="dk-lbl">Draft</div></div></div><div class="d-sl-lbl">By Category</div><div class="d-sl"><span>Collections</span><span>8</span></div><div class="d-sl"><span>Sales & Booking</span><span>7</span></div><div class="d-sl"><span>Referrals</span><span>6</span></div><div class="d-sl"><span>Possession</span><span>5</span></div><div class="d-sl"><span>Marketing Engagement</span><span>5</span></div><div class="d-sl"><span>App Adoption</span><span>3</span></div>`,
  'stmt-lookup':`<div style="margin-bottom:12px;font-size:11px;color:var(--sage)">Enter member ID, name, or phone to pull account statement.</div><input style="width:100%;font-family:'Poppins',sans-serif;font-size:12px;border:1px solid var(--border);border-radius:8px;padding:8px 12px;outline:none;margin-bottom:8px" placeholder="Search member…"><button class="action-btn" onclick="showToast('Statement generated for Rajesh Mehta')">📄 Pull Statement</button><button class="action-btn outline" onclick="showToast('Statement exported to PDF')">📤 Export PDF</button>`,
  'ledger-view':`<div class="d-sl-lbl">Recent Transactions</div><div class="d-sl"><span>19 Jun 11:42 · Rajesh Mehta</span><span style="color:#085041;font-weight:700">+6,000</span></div><div class="d-sl"><span>19 Jun 11:08 · Sunita Patel</span><span style="color:#A32D2D;font-weight:700">-9,400</span></div><div class="d-sl"><span>19 Jun 09:15 · Vikram Singh</span><span style="color:#085041;font-weight:700">+250</span></div><div class="d-sl"><span>18 Jun 16:30 · Anita Desai</span><span style="color:#A32D2D;font-weight:700">-4,800</span></div><button class="action-btn outline" onclick="showToast('Full ledger exported')">📤 Export Ledger CSV</button>`,
  'orders-total':`<div class="dk-strip"><div class="dk"><div class="dk-val">52</div><div class="dk-lbl">Total</div></div><div class="dk"><div class="dk-val" style="color:#085041">45</div><div class="dk-lbl">Fulfilled</div></div><div class="dk"><div class="dk-val" style="color:#A32D2D">7</div><div class="dk-lbl">Stuck</div></div></div><div class="d-sl-lbl">Order Age</div><div class="d-sl"><span>0-30 days</span><span style="font-weight:600">38</span></div><div class="d-sl"><span>31-60 days</span><span style="font-weight:600">7</span></div><div class="d-sl"><span>61-90 days</span><span>0</span></div><div class="d-sl"><span>90+ days</span><span style="color:#A32D2D;font-weight:700">7</span></div>`,
  'orders-stuck':`<div class="dk-strip"><div class="dk"><div class="dk-val" style="color:#A32D2D">7</div><div class="dk-lbl">Stuck Orders</div></div><div class="dk"><div class="dk-val">107</div><div class="dk-lbl">Days — Oldest</div></div><div class="dk"><div class="dk-val" style="color:#085041">100%</div><div class="dk-lbl">Already Paid</div></div></div><div class="d-sl-lbl">Root Cause</div><div style="padding:8px;background:var(--bg);border-radius:6px;font-size:10.5px;line-height:1.6">All 7 belong to customer Roshan Shetty, created 12–13 Mar 2026. Payment cleared and points were deducted, but order status was never advanced past Pending — a fulfilment follow-up gap, not a payment issue.</div><button class="action-btn" onclick="showToast('Opening Orders — filtered to Pending…')">🧾 Filter Pending Orders</button>`,
  'orders-customer':`<div class="dk-strip"><div class="dk"><div class="dk-val">Roshan Shetty</div><div class="dk-lbl">Customer</div></div><div class="dk"><div class="dk-val" style="color:#A32D2D">7</div><div class="dk-lbl">Stuck Orders</div></div></div><div class="d-sl-lbl">Order Total</div><div class="d-sl"><span>Combined value</span><span style="font-weight:700">₹22,197</span></div><div class="d-sl"><span>Date range</span><span>12–13 Mar 2026</span></div>`,
  'store-live':`<div class="dk-strip"><div class="dk"><div class="dk-val" style="color:#A32D2D">0</div><div class="dk-lbl">Live in Store</div></div><div class="dk"><div class="dk-val" style="color:#085041">3,235</div><div class="dk-lbl">In Aggregator</div></div></div><div class="d-sl-lbl">By Category</div><div class="d-sl"><span>Merchandise</span><span>0 of 3,165</span></div><div class="d-sl"><span>Lounge</span><span>0 of 62</span></div><div class="d-sl"><span>Miles</span><span>0 of 8</span></div><button class="action-btn" onclick="showToast('Opening Aggregator Inventory…')">🏪 Go to Aggregator Inventory</button>`,
  'store-aggregator':`<div class="dk-strip"><div class="dk"><div class="dk-val">3,235</div><div class="dk-lbl">Total Items</div></div></div><div class="d-sl-lbl">Available to Add</div><div class="d-sl"><span>🛍️ Merchandise</span><span style="color:#085041;font-weight:600">3,165 items</span></div><div class="d-sl"><span>✈️ Lounge Access</span><span style="color:#085041;font-weight:600">62 items</span></div><div class="d-sl"><span>🛫 Airline Miles</span><span style="color:#085041;font-weight:600">8 items</span></div><div class="d-sl"><span>🎁 Gift Cards</span><span style="color:var(--sage)">0 items</span></div>`,
  'store-empty-days':`<div class="dk-strip"><div class="dk"><div class="dk-val" style="color:#BA7517">27+</div><div class="dk-lbl">Days Empty</div></div></div><div style="padding:8px;background:#FFFAF0;border-radius:8px;border:1px solid #EDC48840;font-size:11px;line-height:1.6">The store has had 0 live items since the programme went live. 12,400 points have been issued in that window with no redemption path — this is the single highest-priority fix on the programme.</div>`,
  'cat-merch':`<div class="dk-strip"><div class="dk"><div class="dk-val">3,165</div><div class="dk-lbl">Available</div></div><div class="dk"><div class="dk-val" style="color:#A32D2D">0</div><div class="dk-lbl">Live</div></div></div><div style="padding:8px;background:var(--bg);border-radius:6px;font-size:10.5px;line-height:1.6">98% of all available inventory. Enough breadth to serve all 3 active members immediately — recommended starting category.</div><button class="action-btn" onclick="showToast('Opening Merchandise tab…')">🛍️ Add Merchandise Items</button>`,
  'cat-lounge':`<div class="dk-strip"><div class="dk"><div class="dk-val">62</div><div class="dk-lbl">Available</div></div><div class="dk"><div class="dk-val" style="color:#A32D2D">0</div><div class="dk-lbl">Live</div></div></div><div style="padding:8px;background:var(--bg);border-radius:6px;font-size:10.5px;line-height:1.6">High-value, niche redemption. Airport lounges across multiple cities — good for engaged high-tier members once Merchandise is live.</div>`,
  'cat-miles':`<div class="dk-strip"><div class="dk"><div class="dk-val">8</div><div class="dk-lbl">Available</div></div><div class="dk"><div class="dk-val" style="color:#A32D2D">0</div><div class="dk-lbl">Live</div></div></div><div style="padding:8px;background:var(--bg);border-radius:6px;font-size:10.5px;line-height:1.6">Smallest category — airline mile transfer programmes (CitiLink, SriLankan FlySmiles, AirAsia MOVE, and others).</div>`,
  'ord-1':`<div class="d-sl"><span>Order ID</span><span style="font-weight:600">ORD20260312-8032B</span></div><div class="d-sl"><span>Amount</span><span style="font-weight:700">₹660</span></div><div class="d-sl"><span>Customer</span><span>Roshan Shetty</span></div><div class="d-sl"><span>Created</span><span>12 Mar 2026</span></div><div class="d-sl"><span>Days Stuck</span><span style="color:#A32D2D;font-weight:700">107</span></div><div class="d-sl"><span>Payment</span><span class="badge b-ok">Paid</span></div><div class="d-sl"><span>Status</span><span class="badge b-warn">Pending</span></div><button class="action-btn" onclick="showToast('Order marked as fulfilled')">✓ Mark as Fulfilled</button>`,
  'ord-2':`<div class="d-sl"><span>Order ID</span><span style="font-weight:600">ORD20260312-C3DB</span></div><div class="d-sl"><span>Amount</span><span style="font-weight:700">₹6,203</span></div><div class="d-sl"><span>Customer</span><span>Roshan Shetty</span></div><div class="d-sl"><span>Created</span><span>12 Mar 2026</span></div><div class="d-sl"><span>Days Stuck</span><span style="color:#A32D2D;font-weight:700">107</span></div><button class="action-btn" onclick="showToast('Order marked as fulfilled')">✓ Mark as Fulfilled</button>`
};

window.drillStack=[];
window.openDrill = function openDrill(key,meta){
  const body=document.getElementById('drillBody');
  const title=meta&&meta.title?meta.title:key;
  drillStack=[{key,title}];
  document.getElementById('drillTitle').textContent=title;
  document.getElementById('drillBc').innerHTML=`<span class="bc-item" style="cursor:default;color:var(--dark)">${title}</span>`;
  body.innerHTML=DRILLS[key]||buildGenericDrill(title);
  document.getElementById('drillOv').classList.add('open');
  document.getElementById('drillPanel').classList.add('open');
}
window.buildGenericDrill = function buildGenericDrill(title){
  const pts=Math.floor(Math.random()*8000+2000),fires=Math.floor(Math.random()*400+80);
  return`<div class="dk-strip"><div class="dk"><div class="dk-val">${pts.toLocaleString()}</div><div class="dk-lbl">Points (MTD)</div></div><div class="dk"><div class="dk-val">${fires}</div><div class="dk-lbl">Events Today</div></div></div><div class="d-sl-lbl">Detail for ${title}</div><div class="d-sl"><span>Status</span><span class="badge b-ok">● Active</span></div><div class="d-sl"><span>Last updated</span><span>Today 11:42</span></div><div class="d-sl"><span>Trend vs last month</span><span style="color:#085041;font-weight:600">↑ 14%</span></div><button class="action-btn outline" onclick="showToast('Action completed')">Take Action</button>`;
}
window.closeDrill = function closeDrill(){
  document.getElementById('drillOv').classList.remove('open');
  document.getElementById('drillPanel').classList.remove('open');
  drillStack=[];
}

/* ── TOAST ── */
window.showToast = function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

/* ── LIVE DATE ── */
function tick(){
  const n=new Date();
  document.getElementById('liveDate').textContent=n.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' · '+n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}
tick();setInterval(tick,30000);

/* ══════════════════════════════════════════════════
   AI — SYSTEM PROMPT + DATA CONTEXT
══════════════════════════════════════════════════ */
const SYS_PROMPT=`You are a loyalty programme analyst writing for a Loyalty Rule Engine admin dashboard used by a real estate developer.

Current programme snapshot:
- Total active members: 2,847 (Bronze: 1,420 · Silver: 1,042 · Gold: 385)
- Points issued this month: 1,24,500 (62% of monthly cap)
- Redemption rate: 23.4% (2,912 of 12,450 eligible transactions)
- Active rules: 34 across 6 categories (Collections, Marketing Engagement, Possession, Sales & Booking, Referrals, App Adoption)
- Top category by fires: Collections (4,120 fires, 8 rules)
- Expired points to date: 0 (expiry window not yet confirmed with dev team)
- Lapsed members (60+ days inactive): 318
- Pending encashments: 42 (₹2.1L outstanding)
- Top earner this month: Rajesh Mehta (18,400 points)
- Total outstanding points balance: 6,45,100 (Cold: 3,22,550 · Active: 3,22,550)
- Programme ROI estimate: ₹18.4L in accelerated collections vs ₹1,24,500 cost = 14.8× return

Rules you must follow without exception:
- Use ONLY the numbers provided above. Never invent figures.
- Every sentence must contain at least one specific number, name, or percentage from the data.
- End with exactly one action. Name the specific thing to do.
- Maximum 3 sentences. Hard limit.
- Never write: appears, seems, may, could, might.
- Plain text only. No bullet points, no bold, no markdown.
- Do not start with "The data shows" or "Based on the data".`;

/* ── CHART INSIGHT PROMPTS ── */
const INSIGHT_PROMPTS={
  trend:()=>`Points issued 6-month series: Jan 68,400 · Feb 74,200 · Mar 88,600 · Apr 1,01,300 · May 1,18,400 · Jun 1,24,500. Points redeemed: Jan 12,400 · Feb 15,800 · Mar 21,200 · Apr 28,400 · May 34,600 · Jun 40,800. The gap between issued and redeemed is widening each month. Write one insight about this trend and end with one specific action to narrow the redemption gap before month-end.`,
  tiers:()=>`Tier distribution: Bronze 1,420 (50%) · Silver 1,042 (36.6%) · Gold 385 (13.5%). Total members: 2,847. Write one insight about whether this tier distribution is healthy for the programme and end with one specific rule configuration action to accelerate Bronze-to-Silver upgrades.`,
  rulecat:()=>`Rules fired by category this month: Collections 4,120 · Marketing Engagement 3,200 · Possession 2,340 · Sales & Booking 1,650 · Referrals 890 · App Adoption 780. Total fires: 12,980 across 34 rules. Write one insight about category imbalance and end with one specific action for the lowest-performing category.`,
  tierdist:()=>`Tier distribution: Bronze 1,420 (50%) · Silver 1,042 (36.6%) · Gold 385 (13.5%). 318 members have been inactive for 60+ days (all in Bronze tier). Write one insight connecting lapsed members to Bronze concentration and end with one specific rule to reduce Bronze lapse rate.`,
  redtype:()=>`Redemption by type: Encashment 1,240 (42.5%) · Vouchers 680 (23.3%) · Merchandise 420 (14.4%) · Travel & Ticketing 280 (9.6%) · Experiences 180 (6.2%) · Lounge Access 112 (3.8%). Total: 2,912. Write one insight about concentration risk in encashment and end with one specific action to promote an underused redemption category.`,
  redtrend:()=>`Redemption rate by month: Jan 8.4% · Feb 11.2% · Mar 14.8% · Apr 17.6% · May 20.4% · Jun 23.4%. Target is 30%. Monthly improvement is averaging +2.5 percentage points. Write one insight about the trajectory to target and end with one specific rule change to accelerate the rate improvement.`,
  walletflow:()=>`Monthly issued: Jan 68,400 · Feb 74,200 · Mar 88,600 · Apr 1,01,300 · May 1,18,400 · Jun 1,24,500. Monthly redeemed: Jan 12,400 · Feb 15,800 · Mar 21,200 · Apr 28,400 · May 34,600 · Jun 40,800. Cumulative balance growing to 6,45,100 outstanding. Write one insight about the growing unredeemed balance and end with one specific action to accelerate redemption before the balance creates liability pressure.`,
  orderage:()=>`Order age distribution: 0-30 days 38 orders, 31-60 days 7 orders, 61-90 days 0 orders, 90+ days 7 orders. All 7 orders in the 90+ day bucket belong to one customer (Roshan Shetty), created 12-13 Mar 2026, oldest now 107 days, all already Paid. Write one insight about whether this is a systemic pattern or an isolated incident and end with one specific action.`,
  orderstatus:()=>`Order fulfilment split: 45 orders Fulfilled, 7 orders Stuck (Paid but Pending). All 7 stuck orders have payment already cleared. Write one insight about whether this is a payment problem or a fulfilment problem and end with one specific action.`,
  funnel:()=>`Store pipeline by category: Merchandise 3,165 available in aggregator, 0 added to store, 0 redeemed. Lounge 62 available, 0 added, 0 redeemed. Miles 8 available, 0 added, 0 redeemed. All three categories break at the identical step. Write one insight about whether this is a per-category content problem or a single workflow blocker and end with one specific action.`,
  catmix:()=>`Category composition of items waiting to be added to store: Merchandise 3,165 (97.8%), Lounge 62 (1.9%), Miles 8 (0.3%). Total 3,235 items, 0 currently live. Write one insight about which category should be prioritised first and end with one specific action.`
};

async function genInsight(id,btn){
  const txtEl=document.getElementById('ins-txt-'+id);
  if(!txtEl)return;
  btn.disabled=true;btn.textContent='✦ Generating…';btn.classList.add('loading');
  txtEl.classList.remove('placeholder');txtEl.textContent='Analysing data…';
  const prompt=INSIGHT_PROMPTS[id]?INSIGHT_PROMPTS[id]():'Summarise loyalty programme performance and give one specific action.';
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:SYS_PROMPT,messages:[{role:'user',content:prompt}]})
    });
    const data=await res.json();
    if(data.content&&data.content[0]&&data.content[0].text){
      let text=data.content[0].text.trim();
      if(text.length>350){const cut=text.lastIndexOf('.',349);text=text.slice(0,cut>200?cut+1:350)+'…';}
      text=text.replace(/\?/g,'.');
      ['appears to','seems like','may be','could be','might be'].forEach(h=>{text=text.replace(new RegExp(h,'gi'),'is');});
      txtEl.textContent=text;txtEl.classList.remove('placeholder');
    }else{txtEl.textContent=FALLBACKS[id]||'Analysis unavailable — check network connection.';}
  }catch(e){txtEl.textContent=FALLBACKS[id]||'Analysis unavailable — check network connection.';}
  btn.disabled=false;btn.textContent='✦ Regenerate';btn.classList.remove('loading');
}

const FALLBACKS={
  trend:'Points redeemed (40,800) represent only 32.8% of points issued (1,24,500) in June, and the redemption gap has widened every month since January. Launch a time-based rule that awards 300 bonus points to any member who redeems within 14 days of receiving a new credit — this directly narrows the gap.',
  tiers:'50% of members are Bronze tier, and all 318 lapsed members are concentrated in this cohort — indicating that Bronze members are not seeing enough value to stay engaged. Add a milestone rule awarding 500 points when a Bronze member reaches their 3rd payment, creating a clear upgrade pathway to Silver.',
  rulecat:'Collections rules (4,120 fires) drive 31.7% of all rule activity, confirming that the early payment incentive is the highest-ROI programme component. App Adoption rules (780 fires) are the lowest — add a daily login streak rule to triple this category contribution.',
  tierdist:'Bronze tier holds 50% of members (1,420) and contains 224 of the 318 lapsed members, a 15.8% lapse rate vs 4% for Silver. Create a time-based re-engagement rule that delivers 200 bonus points to any Bronze member inactive for 30 days via push notification.',
  redtype:'Encashment dominates at 42.5% of all redemptions, creating concentration risk if cash flow tightens. Promote Experiences and Lounge Access (combined 10%) with a limited-time 1.5× point multiplier on these categories to diversify the redemption mix.',
  redtrend:'Redemption rate improved from 8.4% in January to 23.4% in June, averaging +2.5 percentage points per month — at this pace the 30% target is 3 months away. Add personalised push notifications when a member accumulates enough points for their preferred redemption category to close the gap faster.',
  walletflow:'The cumulative outstanding balance has grown to 6,45,100 points — 5.2× the monthly issuance rate — and if all points were redeemed simultaneously it would represent ₹6,45,100 in encashment liability. Run a targeted "Redeem Now" campaign for the 1,042 Silver members with balances above 2,000 points to reduce the liability pool by an estimated 20%.',
  orderage:'All 7 stuck orders sit in the 90+ day bucket and belong to a single customer, Roshan Shetty, created in a 2-day window (12-13 Mar) — no other order from any period or customer is stuck. This is a one-time fulfilment failure, not a systemic gap. Push all 7 through fulfilment now without re-verifying payment, since all 7 are already Paid.',
  orderstatus:'86.5% of orders (45 of 52) complete normally, and the stuck 13.5% all have payment already cleared — this is a fulfilment follow-up gap, not a payment issue. Assign a team member to close out the 7 Roshan Shetty orders this week to prevent the pattern from repeating with future customers.',
  funnel:'All three categories — Merchandise (3,165), Lounge (62), and Miles (8) — pass step 1 identically and fail at step 2, confirming this is one blocked workflow step, not three separate content gaps. Unblock the single "Add to Store" action once and all 3,235 items become available simultaneously.',
  catmix:'Merchandise makes up 97.8% of available inventory (3,165 of 3,235 items) — more than enough breadth to serve all 3 active members immediately. Add Merchandise items first as a 50-100 item test batch, then expand to Lounge and Miles once verified working.'
};

/* ══════════════════════════════════════════════════
   AI CHAT BOT — Full Anthropic API
══════════════════════════════════════════════════ */
window.aiOpen=false;
window.chatHistory=[];

window.toggleAI = function toggleAI(){
  aiOpen=!aiOpen;
  document.getElementById('ai-wrap').classList.toggle('open',aiOpen);
  document.getElementById('ai-fab').textContent=aiOpen?'×':'✦';
}

window.aiSug = function aiSug(btn){
  const q=btn.textContent;
  document.getElementById('ai-sugs').style.display='none';
  addMsg(q,'user');showTyping();
  callAPI(q);
}

window.sendAI = function sendAI(){
  const inp=document.getElementById('ai-inp');
  const q=inp.value.trim();
  if(!q)return;
  inp.value='';
  document.getElementById('ai-sugs').style.display='none';
  addMsg(q,'user');showTyping();
  callAPI(q);
}

window.callAPI = async function callAPI(q){
  chatHistory.push({role:'user',content:q});
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:1000,
        system:SYS_PROMPT+`\n\nFor the chat interface: respond conversationally in 2-4 sentences. Use specific numbers from the programme snapshot. End with one concrete action. Use plain text — no markdown, no asterisks for bold. Numbers and names are fine inline.`,
        messages:chatHistory
      })
    });
    const data=await res.json();
    let reply='I could not process that — please try again.';
    if(data.content&&data.content[0]&&data.content[0].text){
      reply=data.content[0].text.trim();
    }
    chatHistory.push({role:'assistant',content:reply});
    finishTyping(reply);
  }catch(e){
    const fb=getBotFallback(q);
    chatHistory.push({role:'assistant',content:fb});
    finishTyping(fb);
  }
}

window.getBotFallback = function getBotFallback(q){
  const l=q.toLowerCase();
  if(l.includes('rules')||l.includes('fired'))return'Collections rules fired 4,120 times this month — the highest of any category — confirming that the early payment incentive is working. 2 rules are currently paused (Birthday Bonus and one Referral rule). Reactivate the Birthday Bonus rule now to capture the 38 members with birthdays this month before the opportunity passes.';
  if(l.includes('expir')||l.includes('risk'))return'No points have expired to date, but that number needs a caveat: the expiry window for this programme hasn\'t been confirmed with the dev team yet, so it isn\'t clear whether 0 means "nothing has lapsed yet" or "no expiry policy exists." Confirm the expiry configuration first — 6,45,100 points are outstanding and the answer changes how much of that is actually at risk.';
  if(l.includes('redemption')||l.includes('redeem'))return'Redemption rate is 23.4% this month — up from 8.4% in January, a 2.8× improvement in 6 months. 42.5% of redemptions are encashments (1,240 redemptions), which means members prefer cash over products. Promote the Travel & Ticketing category (only 9.6%) with a 1.5× bonus to diversify the redemption mix and reduce encashment pressure.';
  if(l.includes('tier')||l.includes('gold')||l.includes('silver'))return'Gold tier has 385 members (13.5%), Silver 1,042 (36.6%), and Bronze 1,420 (50%). All 318 lapsed members are concentrated in Bronze — a 22.3% lapse rate for that tier. Add a milestone rule giving 500 bonus points at the 3rd payment to create a clear Bronze-to-Silver upgrade pathway.';
  if(l.includes('top earn')||l.includes('earner'))return'Top earner this month is Rajesh Mehta with 18,400 points earned, followed by Priya Sharma at 16,200. Both are Gold tier members using the 2× multiplier rule. Sunita Patel earned and fully redeemed 9,400 points in the same month — she is your highest-engagement member and the best candidate for a referral programme outreach.';
  if(l.includes('today')||l.includes('attention')||l.includes('action'))return'3 things need attention today: 42 pending encashments worth ₹2.1L are awaiting processing, 12 new encashments arrived this morning. 318 lapsed members have not been targeted with any re-engagement rule. Birthday Bonus rule is paused and 38 members have birthdays this month. Process the pending encashments first — customers waiting on cash payouts are your highest churn risk.';
  return`Your programme is performing well with 2,847 active members and 34 live rules. The biggest opportunity right now is the 318 lapsed Bronze members and the 42 pending encashments worth ₹2.1L. Try asking: which rules fired most today, why is redemption rate low, or what needs attention today.`;
}

window.typingEl=null;
window.addMsg = function addMsg(text,role){
  const m=document.getElementById('ai-msgs');
  const d=document.createElement('div');
  d.className='ai-msg '+role;d.textContent=text;
  m.appendChild(d);m.scrollTop=m.scrollHeight;
}
window.showTyping = function showTyping(){
  const m=document.getElementById('ai-msgs');
  typingEl=document.createElement('div');typingEl.className='ai-typing';
  typingEl.innerHTML='<span></span><span></span><span></span>';
  m.appendChild(typingEl);m.scrollTop=m.scrollHeight;
}
window.finishTyping = function finishTyping(text){
  if(typingEl){typingEl.remove();typingEl=null;}
  const m=document.getElementById('ai-msgs');
  const d=document.createElement('div');d.className='ai-msg bot';d.textContent=text;
  m.appendChild(d);m.scrollTop=m.scrollHeight;
}

/* ── INIT ── */
window.addEventListener('load',()=>{
  Object.keys(CD).forEach(id=>{if(document.getElementById('c-'+id))renderChart(id);});
});

    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      


<div className="topbar">
  <div className="tb-left">
    <div className="tb-logo">
      <div className="tb-mark">
        <svg viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.8L19.2 8.5v7L12 19.2 4.8 15.5v-7L12 4.8z" /></svg>
      </div>
      <div><div className="tb-name">Loyalty Rule Engine</div><div className="tb-sub">Lockated · GoPhygital.work</div></div>
    </div>
    <div className="tb-div"></div>
    <a className="tb-home" onClick={(e) => { e.preventDefault(); navigate("/loyalty/dashboard"); }} href="#">
      <span style={{ fontSize: "10px" }}>←</span>
      <span className="tb-home-lbl">Home</span>
    </a>
    <div className="tb-div"></div>
    <div className="prog-sel">
      <span style={{ fontSize: "12px" }}>🏢</span>
      <select id="progSel">
        <option>Prestige Realty — Main Programme</option>
        <option>Phase 2 Pilot</option>
        <option>Broker Programme</option>
      </select>
    </div>
  </div>
  <div className="tb-right">
    <div className="wf-badge">Review Build · Jun 2026</div>
    
    <div className="tb-filter" id="tbFilterWrap">
      <button className="tb-filter-btn" onClick={(event) => { toggleFilter(event) }}>
        <span className="tb-filter-ico">📅</span>
        <span className="tb-filter-lbl" id="tbFilterLbl">This Month</span>
        <span className="tb-filter-caret">▾</span>
      </button>
      <div className="tb-filter-drop" id="tbFilterDrop">
        <div className="tfd-row">
          <div className="tfd-grp">
            <button className="tfd-btn" onClick={(event) => { setDFMode('day',event.currentTarget) }}>Day</button>
            <button className="tfd-btn active" onClick={(event) => { setDFMode('month',event.currentTarget) }}>Month</button>
            <button className="tfd-btn" onClick={(event) => { setDFMode('range',event.currentTarget) }}>Range</button>
          </div>
        </div>
        <div id="df-day-wrap" style={{ display: "none" }} className="tfd-row">
          <input type="date" className="tfd-inp" id="df-day-input" value="2026-06-19" />
        </div>
        <div id="df-month-wrap" style={{ display: "flex" }} className="tfd-row">
          <input type="month" className="tfd-inp" id="df-month-input" value="2026-06" />
        </div>
        <div id="df-range-wrap" style={{ display: "none" }} className="tfd-row">
          <input type="date" className="tfd-inp" id="df-from-input" value="2026-06-01" />
          <span className="tfd-sep">→</span>
          <input type="date" className="tfd-inp" id="df-to-input" value="2026-06-19" />
        </div>
        <div className="tfd-actions">
          <button className="tfd-apply" onClick={(event) => { applyDF() }}>Apply</button>
          <button className="tfd-reset" onClick={(event) => { resetDF() }}>Reset</button>
        </div>
        <div className="tfd-presets">
          <button className="tfd-preset" onClick={(event) => { setPreset('today',event.currentTarget) }}>Today</button>
          <button className="tfd-preset" onClick={(event) => { setPreset('7d',event.currentTarget) }}>Last 7 Days</button>
          <button className="tfd-preset" onClick={(event) => { setPreset('30d',event.currentTarget) }}>Last 30 Days</button>
          <button className="tfd-preset active" onClick={(event) => { setPreset('event.currentTargetmonth',event.currentTarget) }}>This Month</button>
          <button className="tfd-preset" onClick={(event) => { setPreset('lastmonth',event.currentTarget) }}>Last Month</button>
          <button className="tfd-preset" onClick={(event) => { setPreset('event.currentTargetquarter',event.currentTarget) }}>This Quarter</button>
        </div>
      </div>
    </div>
    <div className="tb-date" id="liveDate"></div>
    <div className="role-badge">Programme Admin</div>
    <div className="tb-av">PA</div>
  </div>
</div>


<div className="tabnav">
  <div className="tn active" onClick={(event) => { switchTab('overview',event.currentTarget) }}><span className="tn-ico">📊</span> Overview</div>
  <div className="tn" onClick={(event) => { switchTab('rules',event.currentTarget) }}><span className="tn-ico">⚙️</span> Rules Engine</div>
  <div className="tn" onClick={(event) => { switchTab('members',event.currentTarget) }}><span className="tn-ico">👥</span> Members</div>
  <div className="tn" onClick={(event) => { switchTab('redemption',event.currentTarget) }}><span className="tn-ico">🎁</span> Redemption</div>
  <div className="tn" onClick={(event) => { switchTab('wallet',event.currentTarget) }}><span className="tn-ico">💰</span> Wallet</div>
  <div className="tn" onClick={(event) => { switchTab('orders',event.currentTarget) }}><span className="tn-ico">🧾</span> Orders</div>
  <div className="tn" onClick={(event) => { switchTab('storeinv',event.currentTarget) }}><span className="tn-ico">🏪</span> Store & Inventory</div>
</div>




<div className="content" id="mainContent">


<div className="tp active" id="tab-overview">

  
  <div className="briefing">
    <div className="brief-ico">✦</div>
    <div>
      <div className="brief-label">Programme Briefing — 19 Jun 2026</div>
      <div className="brief-text"><strong>Programme healthy.</strong> <strong>34 rules active</strong> across 6 categories; Collections rules fired 4,120 times this month. <strong>Redemption rate 23.4%</strong> — driven by encashment (42.5%). <strong>318 members lapsed</strong> (60+ days inactive) — a win-back campaign would recover this cohort before month-end.</div>
    </div>
  </div>

  
  <div className="kpi-strip g5" style={{ marginBottom: "14px" }}>
    <div className="ki" onClick={(event) => { openDrill('members-kpi',{title:'Active Members'}) }}>
      <div className="kt">Active Members</div>
      <div className="kv">2,847</div>
      <div className="ks">↑ 124 new this month</div>
    </div>
    <div className="ki" onClick={(event) => { openDrill('points-kpi',{title:'Points Issued This Month'}) }}>
      <div className="kt">Points Issued</div>
      <div className="kv">1,24,500</div>
      <div className="kpw"><div className="kpb" style={{ width: "62%" }}></div></div>
      <div className="ks">62% of monthly cap</div>
    </div>
    <div className="ki" onClick={(event) => { openDrill('redemption-kpi',{title:'Redemption Rate'}) }}>
      <div className="kt">Redemption Rate</div>
      <div className="kv" style={{ color: "var(--ok)" }}>23.4%</div>
      <div className="ks">2,912 of 12,450 eligible</div>
    </div>
    <div className="ki" onClick={(event) => { openDrill('rules-kpi',{title:'Active Rules'}) }}>
      <div className="kt">Active Rules</div>
      <div className="kv">34</div>
      <div className="ks">Across 6 categories</div>
    </div>
    <div className="ki" onClick={(event) => { openDrill('expired-points',{title:'Expired Points'}) }}>
      <div className="kt">Expired Points</div>
      <div className="kv">0</div>
      <div className="kpw"><div className="kpb" style={{ width: "0%", background: "var(--amber)" }}></div></div>
      <div className="ks" style={{ color: "var(--amber)" }}>Confirm expiry config</div>
    </div>
  </div>

  
  <div className="alert-strip warn" onClick={(event) => { openDrill('lapsed',{title:'Lapsed Members'}) }}>
    <div className="alert-ico">⚠️</div>
    <div className="alert-txt"><strong>318 members inactive 60+ days</strong> — no rule has fired for them. A time-based re-engagement rule would recover this cohort automatically.</div>
    <div className="alert-act">Set up rule →</div>
  </div>

  
  <div className="g g23" style={{ marginBottom: "14px" }}>
    <div className="card">
      <div className="card-hd"><div><div className="card-title">Today's Activity</div><div className="card-sub">19 Jun 2026 · Live</div></div></div>
      <div className="stat-line" onClick={(event) => { openDrill('rules-fired',{title:'Rules Fired Today'}) }}><span>Rules fired today</span><span style={{ fontWeight: "700", color: "var(--coral)" }}>412</span></div>
      <div className="stat-line" onClick={(event) => { openDrill('members-today',{title:'New Members Today'}) }}><span>New member registrations</span><span style={{ fontWeight: "700" }}>7</span></div>
      <div className="stat-line" onClick={(event) => { openDrill('redemptions-today',{title:'Redemptions Today'}) }}><span>Redemptions processed</span><span style={{ fontWeight: "700" }}>84</span></div>
      <div className="stat-line" onClick={(event) => { openDrill('points-today',{title:'Points Awarded Today'}) }}><span>Points awarded</span><span style={{ fontWeight: "700", color: "var(--violet)" }}>4,180</span></div>
      <div className="stat-line" onClick={(event) => { openDrill('encash-today',{title:'Encashments Today'}) }}><span>Encashments pending</span><span style={{ fontWeight: "700", color: "var(--amber)" }}>12</span></div>
      <div className="stat-line" onClick={(event) => { openDrill('tier-upgrades',{title:'Tier Upgrades Today'}) }}><span>Tier upgrades triggered</span><span style={{ fontWeight: "700", color: "var(--forest)" }}>3</span></div>
    </div>

    <div className="card">
      <div className="card-hd"><div><div className="card-title">Rule Categories — This Month</div><div className="card-sub">34 active rules · 12,980 total fires</div></div></div>
      <div className="pb-row" onClick={(event) => { openDrill('rules-collections',{title:'Collections Rules'}) }}>
        <span className="pb-lbl">Collections</span>
        <div className="pb-wrap"><div className="pb-fill" style={{ width: "85%", background: "var(--coral)" }}></div></div>
        <span className="pb-val" style={{ color: "var(--coral)" }}>4,120</span>
      </div>
      <div className="pb-row" onClick={(event) => { openDrill('rules-marketing',{title:'Marketing Engagement Rules'}) }}>
        <span className="pb-lbl">Marketing Engagement</span>
        <div className="pb-wrap"><div className="pb-fill" style={{ width: "66%", background: "var(--violet)" }}></div></div>
        <span className="pb-val" style={{ color: "var(--violet)" }}>3,200</span>
      </div>
      <div className="pb-row" onClick={(event) => { openDrill('rules-possession',{title:'Possession Rules'}) }}>
        <span className="pb-lbl">Possession</span>
        <div className="pb-wrap"><div className="pb-fill" style={{ width: "48%", background: "var(--sky)" }}></div></div>
        <span className="pb-val" style={{ color: "var(--sky)" }}>2,340</span>
      </div>
      <div className="pb-row" onClick={(event) => { openDrill('rules-sales',{title:'Sales & Booking Rules'}) }}>
        <span className="pb-lbl">Sales & Booking</span>
        <div className="pb-wrap"><div className="pb-fill" style={{ width: "34%", background: "var(--forest)" }}></div></div>
        <span className="pb-val" style={{ color: "var(--forest)" }}>1,650</span>
      </div>
      <div className="pb-row" onClick={(event) => { openDrill('rules-referrals',{title:'Referral Rules'}) }}>
        <span className="pb-lbl">Referrals</span>
        <div className="pb-wrap"><div className="pb-fill" style={{ width: "18%", background: "var(--amber)" }}></div></div>
        <span className="pb-val" style={{ color: "var(--amber)" }}>890</span>
      </div>
      <div className="pb-row" onClick={(event) => { openDrill('rules-app',{title:'App Adoption Rules'}) }}>
        <span className="pb-lbl">App Adoption</span>
        <div className="pb-wrap"><div className="pb-fill" style={{ width: "16%", background: "var(--stone)" }}></div></div>
        <span className="pb-val" style={{ color: "var(--stone)" }}>780</span>
      </div>
    </div>
  </div>

  
  <div className="g g2">
    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Points Issued vs Redeemed — 6 Months</div></div>
        <div className="cc-acts">
          <button className="ct-btn active" onClick={(event) => { switchChart('trend','bar',event.currentTarget) }}>Bar</button>
          <button className="ct-btn" onClick={(event) => { switchChart('trend','line',event.currentTarget) }}>Line</button>
          <button className="ct-btn" onClick={(event) => { switchChart('trend','tbl',event.currentTarget) }}>Table</button>
        </div>
      </div>
      <div style={{ height: "180px", position: "relative" }}><canvas id="c-trend"></canvas></div>
      <div id="ct-trend" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-trend" style={{ background: "var(--coral-08)", borderColor: "var(--coral)" }}>
          <div className="i-lbl" style={{ color: "var(--coral-dk)" }}>Programme Trend Insight</div>
          <div className="i-txt placeholder" id="ins-txt-trend">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('trend',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>

    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Member Tier Distribution</div></div>
        <div className="cc-acts">
          <button className="ct-btn active" onClick={(event) => { switchChart('tiers','doughnut',event.currentTarget) }}>Donut</button>
          <button className="ct-btn" onClick={(event) => { switchChart('tiers','bar',event.currentTarget) }}>Bar</button>
          <button className="ct-btn" onClick={(event) => { switchChart('tiers','tbl',event.currentTarget) }}>Table</button>
        </div>
      </div>
      <div style={{ height: "180px", position: "relative" }}><canvas id="c-tiers"></canvas></div>
      <div id="ct-tiers" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-tiers" style={{ background: "var(--violet-08)", borderColor: "var(--violet)" }}>
          <div className="i-lbl" style={{ color: "var(--violet)" }}>Tier Health Insight</div>
          <div className="i-txt placeholder" id="ins-txt-tiers">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('tiers',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>
  </div>

</div>


<div className="tp" id="tab-rules">

  <div className="filter-bar">
    <select className="filter-sel">
      <option>All Categories</option>
      <option>Collections</option><option>Marketing Engagement</option>
      <option>Possession</option><option>Sales & Booking</option>
      <option>Referrals</option><option>App Adoption</option>
    </select>
    <select className="filter-sel">
      <option>All Statuses</option><option>Active</option><option>Paused</option><option>Draft</option>
    </select>
    <select className="filter-sel">
      <option>All Rule Types</option><option>Transaction Events</option>
      <option>Time-Based</option><option>User Actions</option>
      <option>Milestones</option><option>Tier-Based</option>
    </select>
    <input className="filter-search" placeholder="🔍 Search rules…" />
    <button className="qa-btn primary" onClick={(event) => { showToast('Rule builder opened') }}>⚙️ + New Rule</button>
  </div>

  
  <div className="g g3" style={{ marginBottom: "14px" }}>
    <div className="mc coral" onClick={(event) => { openDrill('rules-collections',{title:'Collections Rules — 8 Active'}) }}>
      <div className="mc-lbl">Collections</div>
      <div className="mc-val">8 rules</div>
      <div className="mc-sub">4,120 fires this month · 100% active</div>
      <div className="mc-chips">
        <span className="mc-chip chip-ok">All Active</span>
        <span className="mc-chip chip-info">Demand Note</span>
        <span className="mc-chip chip-info">Early Payment</span>
      </div>
    </div>
    <div className="mc violet" onClick={(event) => { openDrill('rules-marketing',{title:'Marketing Engagement Rules — 5 Active'}) }}>
      <div className="mc-lbl">Marketing Engagement</div>
      <div className="mc-val">5 rules</div>
      <div className="mc-sub">3,200 fires this month · 4 active</div>
      <div className="mc-chips">
        <span className="mc-chip chip-warn">1 Paused</span>
        <span className="mc-chip chip-info">Email Open</span>
        <span className="mc-chip chip-info">App Login</span>
      </div>
    </div>
    <div className="mc sky" onClick={(event) => { openDrill('rules-possession',{title:'Possession Rules — 5 Active'}) }}>
      <div className="mc-lbl">Possession</div>
      <div className="mc-val">5 rules</div>
      <div className="mc-sub">2,340 fires this month · All active</div>
      <div className="mc-chips">
        <span className="mc-chip chip-ok">All Active</span>
        <span className="mc-chip chip-info">Early Payment</span>
        <span className="mc-chip chip-info">Docs Upload</span>
      </div>
    </div>
    <div className="mc forest" onClick={(event) => { openDrill('rules-sales',{title:'Sales & Booking Rules — 7 Active'}) }}>
      <div className="mc-lbl">Sales & Booking</div>
      <div className="mc-val">7 rules</div>
      <div className="mc-sub">1,650 fires this month · 6 active</div>
      <div className="mc-chips">
        <span className="mc-chip chip-warn">1 Draft</span>
        <span className="mc-chip chip-info">Token Payment</span>
        <span className="mc-chip chip-info">Site Visit</span>
      </div>
    </div>
    <div className="mc amber" onClick={(event) => { openDrill('rules-referrals',{title:'Referral Rules — 6 Active'}) }}>
      <div className="mc-lbl">Referrals</div>
      <div className="mc-val">6 rules</div>
      <div className="mc-sub">890 fires this month · 5 active</div>
      <div className="mc-chips">
        <span className="mc-chip chip-warn">1 Paused</span>
        <span className="mc-chip chip-info">Friend Referral</span>
        <span className="mc-chip chip-info">Conversion</span>
      </div>
    </div>
    <div className="mc crimson" onClick={(event) => { openDrill('rules-app',{title:'App Adoption Rules — 3 Active'}) }}>
      <div className="mc-lbl">App Adoption</div>
      <div className="mc-val">3 rules</div>
      <div className="mc-sub">780 fires this month · All active</div>
      <div className="mc-chips">
        <span className="mc-chip chip-ok">All Active</span>
        <span className="mc-chip chip-info">First Login</span>
        <span className="mc-chip chip-info">Profile Complete</span>
      </div>
    </div>
  </div>

  
  <div className="card">
    <div className="card-hd">
      <div><div className="card-title">All Active Rules</div><div className="card-sub">34 rules · click any row to inspect</div></div>
    </div>
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Rule Name</th><th>Category</th><th>Type</th><th>Trigger</th>
            <th>Points</th><th>Fires (MTD)</th><th>Last Fired</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr onClick={(event) => { openDrill('rule-001',{title:'Early Demand Note Payment'}) }}>
            <td style={{ fontWeight: "600" }}>Early Demand Note Payment</td>
            <td><span className="badge b-coral">Collections</span></td>
            <td>Transaction</td><td>Paid ≤ 5 days of demand</td>
            <td><strong>6,000</strong></td><td style={{ color: "var(--coral)", fontWeight: "700" }}>824</td>
            <td>Today 11:42</td>
            <td><span className="badge b-ok">● Active</span></td>
          </tr>
          <tr onClick={(event) => { openDrill('rule-002',{title:'App Login Streak'}) }}>
            <td style={{ fontWeight: "600" }}>App Login Streak — 3 days</td>
            <td><span className="badge b-lav">App Adoption</span></td>
            <td>Engagement</td><td>3 consecutive logins</td>
            <td><strong>250</strong></td><td style={{ color: "var(--violet)", fontWeight: "700" }}>412</td>
            <td>Today 09:15</td>
            <td><span className="badge b-ok">● Active</span></td>
          </tr>
          <tr onClick={(event) => { openDrill('rule-003',{title:'Possession On-Time Incentive'}) }}>
            <td style={{ fontWeight: "600" }}>Possession On-Time Incentive</td>
            <td><span className="badge b-sky">Possession</span></td>
            <td>Milestone</td><td>Docs uploaded 7d before possession</td>
            <td><strong>3,500</strong></td><td style={{ color: "var(--sky)", fontWeight: "700" }}>312</td>
            <td>Today 08:30</td>
            <td><span className="badge b-ok">● Active</span></td>
          </tr>
          <tr onClick={(event) => { openDrill('rule-004',{title:'Referral Conversion'}) }}>
            <td style={{ fontWeight: "600" }}>Referral Conversion Bonus</td>
            <td><span className="badge b-warn">Referrals</span></td>
            <td>User Action</td><td>Referral converts to booking</td>
            <td><strong>10,000</strong></td><td style={{ color: "var(--amber)", fontWeight: "700" }}>48</td>
            <td>Yesterday</td>
            <td><span className="badge b-ok">● Active</span></td>
          </tr>
          <tr onClick={(event) => { openDrill('rule-005',{title:'Birthday Bonus'}) }}>
            <td style={{ fontWeight: "600" }}>Birthday Bonus</td>
            <td><span className="badge b-lav">Marketing</span></td>
            <td>Time-Based</td><td>Member birthday (auto)</td>
            <td><strong>500</strong></td><td style={{ color: "var(--stone)", fontWeight: "600" }}>38</td>
            <td>17 Jun 2026</td>
            <td><span className="badge b-warn">⏸ Paused</span></td>
          </tr>
          <tr onClick={(event) => { openDrill('rule-006',{title:'Gold Tier Multiplier'}) }}>
            <td style={{ fontWeight: "600" }}>Gold Tier 2× Multiplier</td>
            <td><span className="badge b-coral">Collections</span></td>
            <td>Tier-Based</td><td>Any payment · Gold members</td>
            <td><strong>2×</strong></td><td style={{ color: "var(--coral)", fontWeight: "700" }}>614</td>
            <td>Today 10:55</td>
            <td><span className="badge b-ok">● Active</span></td>
          </tr>
          <tr onClick={(event) => { openDrill('rule-007',{title:'Site Visit Points'}) }}>
            <td style={{ fontWeight: "600" }}>Site Visit Points</td>
            <td><span className="badge b-sky">Sales</span></td>
            <td>User Action</td><td>Registered site visit</td>
            <td><strong>300</strong></td><td style={{ color: "var(--sky)", fontWeight: "600" }}>198</td>
            <td>Today 14:20</td>
            <td><span className="badge b-ok">● Active</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  
  <div className="g g2" style={{ marginTop: "14px" }}>
    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Rules Fired by Category — This Month</div></div>
        <div className="cc-acts">
          <button className="ct-btn active" onClick={(event) => { switchChart('rulecat','bar',event.currentTarget) }}>Bar</button>
          <button className="ct-btn" onClick={(event) => { switchChart('rulecat','doughnut',event.currentTarget) }}>Donut</button>
          <button className="ct-btn" onClick={(event) => { switchChart('rulecat','tbl',event.currentTarget) }}>Table</button>
        </div>
      </div>
      <div style={{ height: "200px", position: "relative" }}><canvas id="c-rulecat"></canvas></div>
      <div id="ct-rulecat" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-rulecat" style={{ background: "var(--coral-08)", borderColor: "var(--coral)" }}>
          <div className="i-lbl" style={{ color: "var(--coral-dk)" }}>Rule Performance Insight</div>
          <div className="i-txt placeholder" id="ins-txt-rulecat">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('rulecat',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>

    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Daily Rule Fires — Last 7 Days</div></div>
        <div className="cc-acts">
          <button className="ct-btn active" onClick={(event) => { switchChart('dailyfires','line',event.currentTarget) }}>Line</button>
          <button className="ct-btn" onClick={(event) => { switchChart('dailyfires','bar',event.currentTarget) }}>Bar</button>
          <button className="ct-btn" onClick={(event) => { switchChart('dailyfires','tbl',event.currentTarget) }}>Table</button>
        </div>
      </div>
      <div style={{ height: "200px", position: "relative" }}><canvas id="c-dailyfires"></canvas></div>
      <div id="ct-dailyfires" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
    </div>
  </div>

</div>


<div className="tp" id="tab-members">

  <div className="g g4" style={{ marginBottom: "14px" }}>
    <div className="kic" onClick={(event) => { openDrill('members-kpi',{title:'Total Active Members'}) }}>
      <div className="kic-lbl">Total Members</div>
      <div className="kic-val">2,847</div>
      <div className="kic-sub">↑ 124 new this month</div>
      <div className="kic-bar"><div className="kic-fill" style={{ width: "76%", background: "var(--coral)" }}></div></div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('gold-members',{title:'Gold Tier Members'}) }}>
      <div className="kic-lbl">Gold Members</div>
      <div className="kic-val" style={{ color: "var(--amber)" }}>385</div>
      <div className="kic-sub">13.5% of programme</div>
      <div className="kic-bar"><div className="kic-fill" style={{ width: "13.5%", background: "var(--amber)" }}></div></div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('new-members',{title:'New Members This Month'}) }}>
      <div className="kic-lbl">New This Month</div>
      <div className="kic-val" style={{ color: "var(--forest)" }}>124</div>
      <div className="kic-sub">↑ 18% vs last month</div>
      <div className="kic-bar"><div className="kic-fill" style={{ width: "54%", background: "var(--forest)" }}></div></div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('lapsed',{title:'Lapsed Members'}) }}>
      <div className="kic-lbl">Lapsed (60+ days)</div>
      <div className="kic-val" style={{ color: "var(--crimson)" }}>318</div>
      <div className="kic-sub">⚠ Need re-engagement rule</div>
      <div className="kic-bar"><div className="kic-fill" style={{ width: "11.2%", background: "var(--crimson)" }}></div></div>
    </div>
  </div>

  <div className="g g2" style={{ marginBottom: "14px" }}>
    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Tier Distribution</div></div>
        <div className="cc-acts">
          <button className="ct-btn active" onClick={(event) => { switchChart('tierdist','doughnut',event.currentTarget) }}>Donut</button>
          <button className="ct-btn" onClick={(event) => { switchChart('tierdist','bar',event.currentTarget) }}>Bar</button>
          <button className="ct-btn" onClick={(event) => { switchChart('tierdist','tbl',event.currentTarget) }}>Table</button>
        </div>
      </div>
      <div style={{ height: "200px", position: "relative" }}><canvas id="c-tierdist"></canvas></div>
      <div id="ct-tierdist" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-tierdist" style={{ background: "var(--violet-08)", borderColor: "var(--violet)" }}>
          <div className="i-lbl" style={{ color: "var(--violet)" }}>Tier Distribution Insight</div>
          <div className="i-txt placeholder" id="ins-txt-tierdist">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('tierdist',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>

    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">New Member Registrations — Last 6 Months</div></div>
        <div className="cc-acts">
          <button className="ct-btn active" onClick={(event) => { switchChart('newmem','bar',event.currentTarget) }}>Bar</button>
          <button className="ct-btn" onClick={(event) => { switchChart('newmem','line',event.currentTarget) }}>Line</button>
          <button className="ct-btn" onClick={(event) => { switchChart('newmem','tbl',event.currentTarget) }}>Table</button>
        </div>
      </div>
      <div style={{ height: "200px", position: "relative" }}><canvas id="c-newmem"></canvas></div>
      <div id="ct-newmem" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
    </div>
  </div>

  
  <div className="card">
    <div className="card-hd">
      <div><div className="card-title">Top Earners — This Month</div><div className="card-sub">By points accumulated · click to view full statement</div></div>
    </div>
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr><th>#</th><th>Member</th><th>Tier</th><th>Points Earned</th><th>Points Redeemed</th><th>Balance</th><th>Last Activity</th></tr>
        </thead>
        <tbody>
          <tr onClick={(event) => { openDrill('mem-001',{title:'Rajesh Mehta — Member Statement'}) }}>
            <td style={{ fontWeight: "700", color: "var(--amber)" }}>1</td>
            <td style={{ fontWeight: "600" }}>Rajesh Mehta</td>
            <td><span className="tier-pill tier-gold">● Gold</span></td>
            <td style={{ color: "var(--forest)", fontWeight: "700" }}>18,400</td>
            <td>12,000</td>
            <td style={{ fontWeight: "700" }}>6,400</td>
            <td>Today</td>
          </tr>
          <tr onClick={(event) => { openDrill('mem-002',{title:'Priya Sharma — Member Statement'}) }}>
            <td style={{ fontWeight: "700", color: "var(--stone)" }}>2</td>
            <td style={{ fontWeight: "600" }}>Priya Sharma</td>
            <td><span className="tier-pill tier-gold">● Gold</span></td>
            <td style={{ color: "var(--forest)", fontWeight: "700" }}>16,200</td>
            <td>8,500</td>
            <td style={{ fontWeight: "700" }}>7,700</td>
            <td>Today</td>
          </tr>
          <tr onClick={(event) => { openDrill('mem-003',{title:'Anil Kapoor — Member Statement'}) }}>
            <td style={{ fontWeight: "700", color: "var(--stone)" }}>3</td>
            <td style={{ fontWeight: "600" }}>Anil Kapoor</td>
            <td><span className="tier-pill tier-silver">● Silver</span></td>
            <td style={{ color: "var(--forest)", fontWeight: "700" }}>11,800</td>
            <td>3,200</td>
            <td style={{ fontWeight: "700" }}>8,600</td>
            <td>Yesterday</td>
          </tr>
          <tr onClick={(event) => { openDrill('mem-004',{title:'Sunita Patel — Member Statement'}) }}>
            <td style={{ fontWeight: "700", color: "var(--stone)" }}>4</td>
            <td style={{ fontWeight: "600" }}>Sunita Patel</td>
            <td><span className="tier-pill tier-silver">● Silver</span></td>
            <td style={{ color: "var(--forest)", fontWeight: "700" }}>9,400</td>
            <td>9,400</td>
            <td style={{ fontWeight: "700", color: "var(--amber)" }}>0</td>
            <td>Today</td>
          </tr>
          <tr onClick={(event) => { openDrill('mem-005',{title:'Vikram Singh — Member Statement'}) }}>
            <td style={{ fontWeight: "700", color: "var(--stone)" }}>5</td>
            <td style={{ fontWeight: "600" }}>Vikram Singh</td>
            <td><span className="tier-pill tier-bronze">● Bronze</span></td>
            <td style={{ color: "var(--forest)", fontWeight: "700" }}>7,200</td>
            <td>1,800</td>
            <td style={{ fontWeight: "700" }}>5,400</td>
            <td>18 Jun</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</div>


<div className="tp" id="tab-redemption">

  <div className="g g4" style={{ marginBottom: "14px" }}>
    <div className="kic" onClick={(event) => { openDrill('redemptions-total',{title:'Total Redemptions'}) }}>
      <div className="kic-lbl">Total Redemptions (MTD)</div>
      <div className="kic-val">2,912</div>
      <div className="kic-sub">↑ 14% vs last month</div>
      <div className="kic-bar"><div className="kic-fill" style={{ width: "68%", background: "var(--coral)" }}></div></div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('redemption-kpi',{title:'Redemption Rate'}) }}>
      <div className="kic-lbl">Redemption Rate</div>
      <div className="kic-val" style={{ color: "var(--forest)" }}>23.4%</div>
      <div className="kic-sub">2,912 of 12,450 eligible</div>
      <div className="kic-bar"><div className="kic-fill" style={{ width: "23.4%", background: "var(--forest)" }}></div></div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('encash-pending',{title:'Pending Encashments'}) }}>
      <div className="kic-lbl">Pending Encashments</div>
      <div className="kic-val" style={{ color: "var(--amber)" }}>42</div>
      <div className="kic-sub">₹2.1L outstanding</div>
      <div className="kic-bar"><div className="kic-fill" style={{ width: "42%", background: "var(--amber)" }}></div></div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('top-redeem-type',{title:'Top Redemption Category'}) }}>
      <div className="kic-lbl">Top Category</div>
      <div className="kic-val">Encashment</div>
      <div className="kic-sub">42.5% of all redemptions</div>
    </div>
  </div>

  <div className="g g2" style={{ marginBottom: "14px" }}>
    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Redemption by Type — This Month</div></div>
        <div className="cc-acts">
          <button className="ct-btn active" onClick={(event) => { switchChart('redtype','doughnut',event.currentTarget) }}>Donut</button>
          <button className="ct-btn" onClick={(event) => { switchChart('redtype','bar',event.currentTarget) }}>Bar</button>
          <button className="ct-btn" onClick={(event) => { switchChart('redtype','tbl',event.currentTarget) }}>Table</button>
        </div>
      </div>
      <div style={{ height: "200px", position: "relative" }}><canvas id="c-redtype"></canvas></div>
      <div id="ct-redtype" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-redtype" style={{ background: "var(--forest-08)", borderColor: "var(--forest)" }}>
          <div className="i-lbl" style={{ color: "var(--forest)" }}>Redemption Insight</div>
          <div className="i-txt placeholder" id="ins-txt-redtype">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('redtype',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>

    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Redemption Rate Trend — 6 Months</div></div>
        <div className="cc-acts">
          <button className="ct-btn active" onClick={(event) => { switchChart('redtrend','line',event.currentTarget) }}>Line</button>
          <button className="ct-btn" onClick={(event) => { switchChart('redtrend','bar',event.currentTarget) }}>Bar</button>
          <button className="ct-btn" onClick={(event) => { switchChart('redtrend','tbl',event.currentTarget) }}>Table</button>
        </div>
      </div>
      <div style={{ height: "200px", position: "relative" }}><canvas id="c-redtrend"></canvas></div>
      <div id="ct-redtrend" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-redtrend" style={{ background: "var(--coral-08)", borderColor: "var(--coral)" }}>
          <div className="i-lbl" style={{ color: "var(--coral-dk)" }}>Trend Insight</div>
          <div className="i-txt placeholder" id="ins-txt-redtrend">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('redtrend',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>
  </div>

  
  <div className="card">
    <div className="card-hd"><div><div className="card-title">Pending Encashments</div><div className="card-sub">42 requests · ₹2.1L total · click to process</div></div></div>
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Member</th><th>Points</th><th>₹ Value</th><th>Requested</th><th>Bank</th><th>Status</th></tr></thead>
        <tbody>
          <tr onClick={(event) => { openDrill('encash-001',{title:'Encashment — Sunita Patel'}) }}>
            <td style={{ fontWeight: "600" }}>Sunita Patel</td><td>9,400</td><td style={{ fontWeight: "700" }}>₹9,400</td>
            <td>Today 09:12</td><td>HDFC ****4821</td>
            <td><span className="badge b-warn">Pending</span></td>
          </tr>
          <tr onClick={(event) => { openDrill('encash-002',{title:'Encashment — Deepak Nair'}) }}>
            <td style={{ fontWeight: "600" }}>Deepak Nair</td><td>6,200</td><td style={{ fontWeight: "700" }}>₹6,200</td>
            <td>Today 10:44</td><td>SBI ****2201</td>
            <td><span className="badge b-warn">Pending</span></td>
          </tr>
          <tr onClick={(event) => { openDrill('encash-003',{title:'Encashment — Anita Desai'}) }}>
            <td style={{ fontWeight: "600" }}>Anita Desai</td><td>4,800</td><td style={{ fontWeight: "700" }}>₹4,800</td>
            <td>18 Jun 16:30</td><td>ICICI ****9944</td>
            <td><span className="badge b-sky">Processing</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</div>


<div className="tp" id="tab-wallet">

  <div className="g g3" style={{ marginBottom: "14px" }}>
    
    <div className="metric-meter" onClick={(event) => { openDrill('expired-points',{title:'Expired Points'}) }}>
      <div className="em-lbl">Expired Points</div>
      <div className="em-val" style={{ color: "var(--amber)" }}>0</div>
      <div className="em-bar-wrap"><div className="em-bar" style={{ width: "0%", background: "var(--amber)" }}></div></div>
      <div className="em-note">Expiry window not yet confirmed</div>
      <div className="em-threshold" style={{ background: "#BA751715", color: "var(--amber)" }}>⚠ Confirm with dev team</div>
      <div style={{ marginTop: "10px", fontSize: "10px", color: "var(--sage)" }}>6,45,100 pts outstanding<br />currently unaffected by expiry</div>
    </div>

    
    <div className="card">
      <div className="card-hd"><div><div className="card-title">Wallet Split</div><div className="card-sub">Points in cold vs active wallet</div></div></div>
      <div className="stat-line" onClick={(event) => { openDrill('cold-wallet',{title:'Cold Wallet'}) }}>
        <span style={{ fontWeight: "600" }}>Cold Wallet (locked)</span>
        <span style={{ fontWeight: "700", color: "var(--violet)" }}>3,22,550</span>
      </div>
      <div className="stat-line" onClick={(event) => { openDrill('active-wallet',{title:'Active Wallet'}) }}>
        <span style={{ fontWeight: "600" }}>Active Wallet (redeemable)</span>
        <span style={{ fontWeight: "700", color: "var(--forest)" }}>3,22,550</span>
      </div>
      <div className="stat-line" onClick={(event) => { openDrill('total-outstanding',{title:'Total Outstanding Points'}) }}>
        <span style={{ fontWeight: "600" }}>Total Outstanding</span>
        <span style={{ fontWeight: "700" }}>6,45,100</span>
      </div>
      <div className="stat-line">
        <span style={{ color: "var(--stone)" }}>All-time issued</span>
        <span>8,42,500</span>
      </div>
      <div className="stat-line">
        <span style={{ color: "var(--stone)" }}>Total redeemed</span>
        <span>1,97,400</span>
      </div>
    </div>

    
    <div className="card">
      <div className="card-hd"><div><div className="card-title">Liability Health</div><div className="card-sub">Points cost · ₹1 per point</div></div></div>
      <div className="stat-line" onClick={(event) => { openDrill('liability-total',{title:'Total Loyalty Liability'}) }}>
        <span style={{ fontWeight: "600" }}>Total Liability</span>
        <span style={{ fontWeight: "700", color: "var(--crimson)" }}>₹6,45,100</span>
      </div>
      <div className="stat-line">
        <span style={{ color: "var(--stone)" }}>Points cost (MTD)</span>
        <span>₹1,24,500</span>
      </div>
      <div className="stat-line">
        <span style={{ color: "var(--stone)" }}>Redemption outflow (MTD)</span>
        <span style={{ color: "var(--amber)" }}>₹29,120</span>
      </div>
      <div style={{ marginTop: "12px", padding: "10px", background: "#108C7210", borderRadius: "var(--r8)", border: "1px solid #108C7230" }}>
        <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ok)", marginBottom: "3px" }}>CFO Summary</div>
        <div style={{ fontSize: "11px", color: "var(--dark)", lineHeight: "1.5" }}>Loyalty cost is ₹1,24,500 this month against estimated programme ROI of ₹18.4L in accelerated collections. Net benefit: <strong>14.8× return.</strong></div>
      </div>
    </div>
  </div>

  
  <div className="card">
    <div className="card-hd">
      <div><div className="card-title">Transaction Ledger — Recent</div><div className="card-sub">All point movements · full audit trail · click to inspect</div></div>
      <div style={{ display: "flex", gap: "6px" }}>
        <input className="filter-search" style={{ maxWidth: "180px" }} placeholder="🔍 Search member…" />
        <button className="qa-btn" onClick={(event) => { showToast('Ledger exported to CSV') }}>📤 Export</button>
      </div>
    </div>
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Timestamp</th><th>Member</th><th>Event Type</th><th>Rule</th><th>Points</th><th>Direction</th><th>Balance After</th></tr></thead>
        <tbody>
          <tr onClick={(event) => { openDrill('ledger-001',{title:'Ledger Entry — Rajesh Mehta'}) }}>
            <td style={{ color: "var(--stone)" }}>19 Jun 11:42</td>
            <td style={{ fontWeight: "600" }}>Rajesh Mehta</td>
            <td>Transaction</td>
            <td>Early Demand Note Payment</td>
            <td style={{ color: "var(--forest)", fontWeight: "700" }}>+6,000</td>
            <td><span className="badge b-ok">Credit</span></td>
            <td style={{ fontWeight: "600" }}>6,400</td>
          </tr>
          <tr onClick={(event) => { openDrill('ledger-002',{title:'Ledger Entry — Sunita Patel'}) }}>
            <td style={{ color: "var(--stone)" }}>19 Jun 11:08</td>
            <td style={{ fontWeight: "600" }}>Sunita Patel</td>
            <td>Encashment</td>
            <td>Cash Redemption</td>
            <td style={{ color: "var(--crimson)", fontWeight: "700" }}>-9,400</td>
            <td><span className="badge b-err">Debit</span></td>
            <td style={{ fontWeight: "600" }}>0</td>
          </tr>
          <tr onClick={(event) => { openDrill('ledger-003',{title:'Ledger Entry — Vikram Singh'}) }}>
            <td style={{ color: "var(--stone)" }}>19 Jun 09:15</td>
            <td style={{ fontWeight: "600" }}>Vikram Singh</td>
            <td>Engagement</td>
            <td>App Login Streak</td>
            <td style={{ color: "var(--forest)", fontWeight: "700" }}>+250</td>
            <td><span className="badge b-ok">Credit</span></td>
            <td style={{ fontWeight: "600" }}>5,400</td>
          </tr>
          <tr onClick={(event) => { openDrill('ledger-004',{title:'Ledger Entry — Anita Desai'}) }}>
            <td style={{ color: "var(--stone)" }}>18 Jun 16:30</td>
            <td style={{ fontWeight: "600" }}>Anita Desai</td>
            <td>Encashment</td>
            <td>Cash Redemption</td>
            <td style={{ color: "var(--crimson)", fontWeight: "700" }}>-4,800</td>
            <td><span className="badge b-err">Debit</span></td>
            <td style={{ fontWeight: "600" }}>2,100</td>
          </tr>
          <tr onClick={(event) => { openDrill('ledger-005',{title:'Ledger Entry — Priya Sharma'}) }}>
            <td style={{ color: "var(--stone)" }}>18 Jun 14:20</td>
            <td style={{ fontWeight: "600" }}>Priya Sharma</td>
            <td>Tier Upgrade</td>
            <td>Gold Tier Upgrade Bonus</td>
            <td style={{ color: "var(--forest)", fontWeight: "700" }}>+1,000</td>
            <td><span className="badge b-ok">Credit</span></td>
            <td style={{ fontWeight: "600" }}>7,700</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  
  <div className="chart-card" style={{ marginTop: "14px" }}>
    <div className="cc-hd">
      <div><div className="cc-title">Points Flow — Issued vs Redeemed vs Balance</div></div>
      <div className="cc-acts">
        <button className="ct-btn active" onClick={(event) => { switchChart('walletflow','bar',event.currentTarget) }}>Bar</button>
        <button className="ct-btn" onClick={(event) => { switchChart('walletflow','line',event.currentTarget) }}>Line</button>
        <button className="ct-btn" onClick={(event) => { switchChart('walletflow','tbl',event.currentTarget) }}>Table</button>
      </div>
    </div>
    <div style={{ height: "200px", position: "relative" }}><canvas id="c-walletflow"></canvas></div>
    <div id="ct-walletflow" style={{ display: "none", fontSize: "10px", marginTop: "8px" }}></div>
    <div className="insight-wrap">
      <div className="insight" id="ins-walletflow" style={{ background: "var(--violet-08)", borderColor: "var(--violet)" }}>
        <div className="i-lbl" style={{ color: "var(--violet)" }}>Wallet Health Insight</div>
        <div className="i-txt placeholder" id="ins-txt-walletflow">Click Generate Insight for AI analysis.</div>
      </div>
      <button className="gen-btn" onClick={(event) => { genInsight('walletflow',event.currentTarget) }}>✦ Generate Insight</button>
    </div>
  </div>

</div>


<div className="tp" id="tab-orders">

  <div className="g g3" style={{ marginBottom: "14px" }}>
    <div className="kic" onClick={(event) => { openDrill('orders-total',{title:'Total Orders'}) }}>
      <div className="kic-lbl">Total Orders</div>
      <div className="kic-val">52</div>
      <div className="kic-sub">All time</div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('orders-stuck',{title:'Stuck — Paid, Not Fulfilled'}) }}>
      <div className="kic-lbl">Stuck — Paid, Not Fulfilled</div>
      <div className="kic-val" style={{ color: "var(--crimson)" }}>7</div>
      <div className="kic-sub">13.5% of all orders</div>
      <div className="kic-bar"><div className="kic-fill" style={{ width: "13.5%", background: "var(--crimson)" }}></div></div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('orders-customer',{title:'All 7 Belong To One Customer'}) }}>
      <div className="kic-lbl">All 7 Belong To</div>
      <div className="kic-val" style={{ fontSize: "15px" }}>Roshan Shetty</div>
      <div className="kic-sub">Oldest: 107 days</div>
    </div>
  </div>

  <div className="g g2" style={{ marginBottom: "14px" }}>
    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Order Age Distribution</div></div>
      </div>
      <div style={{ height: "190px", position: "relative" }}><canvas id="c-orderage"></canvas></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-orderage" style={{ background: "var(--coral-08)", borderColor: "var(--coral)" }}>
          <div className="i-lbl" style={{ color: "var(--coral-dk)" }}>Order Backlog Insight</div>
          <div className="i-txt placeholder" id="ins-txt-orderage">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('orderage',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>
    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Fulfilled vs Stuck</div></div>
      </div>
      <div style={{ height: "190px", position: "relative" }}><canvas id="c-orderstatus"></canvas></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-orderstatus" style={{ background: "var(--forest-08)", borderColor: "var(--forest)" }}>
          <div className="i-lbl" style={{ color: "var(--forest)" }}>Fulfilment Insight</div>
          <div className="i-txt placeholder" id="ins-txt-orderstatus">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('orderstatus',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-hd">
      <div><div className="card-title">Stuck Orders — Roshan Shetty</div><div className="card-sub">All 7, oldest first · click to inspect</div></div>
    </div>
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Order ID</th><th>Amount</th><th>Created</th><th>Days Stuck</th><th>Payment</th><th>Status</th></tr></thead>
        <tbody>
          <tr onClick={(event) => { openDrill('ord-1',{title:'ORD20260312-8032B'}) }}><td>ORD20260312-8032B</td><td>₹660</td><td>12 Mar 2026</td><td style={{ color: "var(--crimson)", fontWeight: "700" }}>107</td><td><span className="badge b-ok">Paid</span></td><td><span className="badge b-warn">Pending</span></td></tr>
          <tr onClick={(event) => { openDrill('ord-2',{title:'ORD20260312-C3DB'}) }}><td>ORD20260312-C3DB</td><td>₹6,203</td><td>12 Mar 2026</td><td style={{ color: "var(--crimson)", fontWeight: "700" }}>107</td><td><span className="badge b-ok">Paid</span></td><td><span className="badge b-warn">Pending</span></td></tr>
          <tr onClick={(event) => { openDrill('ord-3',{title:'ORD20260312-0C51'}) }}><td>ORD20260312-0C51</td><td>₹1,771</td><td>12 Mar 2026</td><td style={{ color: "var(--crimson)", fontWeight: "700" }}>107</td><td><span className="badge b-ok">Paid</span></td><td><span className="badge b-warn">Pending</span></td></tr>
          <tr onClick={(event) => { openDrill('ord-4',{title:'ORD20260312-C093'}) }}><td>ORD20260312-C093</td><td>₹6,203</td><td>12 Mar 2026</td><td style={{ color: "var(--crimson)", fontWeight: "700" }}>107</td><td><span className="badge b-ok">Paid</span></td><td><span className="badge b-warn">Pending</span></td></tr>
          <tr onClick={(event) => { openDrill('ord-5',{title:'ORD20260313-4471'}) }}><td>ORD20260313-4471</td><td>₹2,340</td><td>13 Mar 2026</td><td style={{ color: "var(--crimson)", fontWeight: "700" }}>106</td><td><span className="badge b-ok">Paid</span></td><td><span className="badge b-warn">Pending</span></td></tr>
          <tr onClick={(event) => { openDrill('ord-6',{title:'ORD20260313-9902'}) }}><td>ORD20260313-9902</td><td>₹1,140</td><td>13 Mar 2026</td><td style={{ color: "var(--crimson)", fontWeight: "700" }}>106</td><td><span className="badge b-ok">Paid</span></td><td><span className="badge b-warn">Pending</span></td></tr>
          <tr onClick={(event) => { openDrill('ord-7',{title:'ORD20260313-B217'}) }}><td>ORD20260313-B217</td><td>₹3,880</td><td>13 Mar 2026</td><td style={{ color: "var(--crimson)", fontWeight: "700" }}>106</td><td><span className="badge b-ok">Paid</span></td><td><span className="badge b-warn">Pending</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>


<div className="tp" id="tab-storeinv">

  <div className="g g3" style={{ marginBottom: "14px" }}>
    <div className="kic" onClick={(event) => { openDrill('store-live',{title:'Items Live in Store'}) }}>
      <div className="kic-lbl">Live in Store</div>
      <div className="kic-val" style={{ color: "var(--crimson)" }}>0</div>
      <div className="kic-sub">Every category, 0 items published</div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('store-aggregator',{title:'Items in Aggregator'}) }}>
      <div className="kic-lbl">Sitting in Aggregator</div>
      <div className="kic-val" style={{ color: "var(--forest)" }}>3,235</div>
      <div className="kic-sub">Ready to publish today</div>
    </div>
    <div className="kic" onClick={(event) => { openDrill('store-empty-days',{title:'Days Store Has Been Empty'}) }}>
      <div className="kic-lbl">Days Store Has Been Empty</div>
      <div className="kic-val" style={{ color: "var(--amber)" }}>27+</div>
      <div className="kic-sub">Since programme went live</div>
    </div>
  </div>

  <div className="g g3" style={{ marginBottom: "14px" }}>
    <div className="mc forest" onClick={(event) => { openDrill('cat-merch',{title:'Merchandise'}) }}>
      <div className="mc-lbl">Merchandise</div>
      <div className="mc-val">3,165</div>
      <div className="mc-sub">98% of available inventory</div>
    </div>
    <div className="mc amber" onClick={(event) => { openDrill('cat-lounge',{title:'Lounge Access'}) }}>
      <div className="mc-lbl">Lounge Access</div>
      <div className="mc-val">62</div>
      <div className="mc-sub">Niche, high-value redemption</div>
    </div>
    <div className="mc amber" onClick={(event) => { openDrill('cat-miles',{title:'Airline Miles'}) }}>
      <div className="mc-lbl">Airline Miles</div>
      <div className="mc-val">8</div>
      <div className="mc-sub">Smallest category</div>
    </div>
  </div>

  <div className="g g2" style={{ marginBottom: "14px" }}>
    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">The Funnel — Where It Breaks</div></div>
      </div>
      <div style={{ height: "190px", position: "relative" }}><canvas id="c-funnel"></canvas></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-funnel" style={{ background: "var(--coral-08)", borderColor: "var(--coral)" }}>
          <div className="i-lbl" style={{ color: "var(--coral-dk)" }}>Store Pipeline Insight</div>
          <div className="i-txt placeholder" id="ins-txt-funnel">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('funnel',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>
    <div className="chart-card">
      <div className="cc-hd">
        <div><div className="cc-title">Category Composition</div></div>
      </div>
      <div style={{ height: "190px", position: "relative" }}><canvas id="c-catmix"></canvas></div>
      <div className="insight-wrap">
        <div className="insight" id="ins-catmix" style={{ background: "var(--violet-08)", borderColor: "var(--violet)" }}>
          <div className="i-lbl" style={{ color: "var(--violet)" }}>Category Priority Insight</div>
          <div className="i-txt placeholder" id="ins-txt-catmix">Click Generate Insight for AI analysis.</div>
        </div>
        <button className="gen-btn" onClick={(event) => { genInsight('catmix',event.currentTarget) }}>✦ Generate Insight</button>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-hd"><div><div className="card-title">How to Fix</div></div></div>
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Step</th><th>Action</th><th>Owner</th></tr></thead>
        <tbody>
          <tr><td><span className="badge b-err">1</span></td><td>Open Aggregator Inventory → Merchandise tab</td><td>Programme Admin</td></tr>
          <tr><td><span className="badge b-warn">2</span></td><td>Select items → click "Add to Store" (start with 50–100 to test)</td><td>Programme Admin</td></tr>
          <tr><td><span className="badge b-warn">3</span></td><td>Confirm items appear live in Inventory Section</td><td>Programme Admin</td></tr>
          <tr><td><span className="badge b-ok">4</span></td><td>Repeat for Lounge (62) and Miles (8) once Merchandise is verified</td><td>Programme Admin</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>

</div>


<div className="drill-ov" id="drillOv" onClick={(event) => { closeDrill() }}></div>
<div className="drill-panel" id="drillPanel">
  <div className="drill-hd">
    <div className="drill-title" id="drillTitle">Detail</div>
    <button className="drill-close" onClick={(event) => { closeDrill() }}>×</button>
  </div>
  <div className="drill-bc" id="drillBc"></div>
  <div className="drill-body" id="drillBody"></div>
</div>


<div className="ai-wrap" id="ai-wrap">
  <div className="ai-hd">
    <div className="ai-av">✦</div>
    <div className="ai-info">
      <div className="ai-nm">Loyalty AI</div>
      <div className="ai-st">● Online · Programme Context Loaded</div>
    </div>
    <button className="ai-x" onClick={(event) => { toggleAI() }}>×</button>
  </div>
  <div className="ai-msgs" id="ai-msgs">
    <div className="ai-msg bot">Hi! I'm your Loyalty Programme assistant. Ask me about rules, members, redemptions, expiring points, or anything on the dashboard. 🎯</div>
  </div>
  <div className="ai-sugs" id="ai-sugs">
    <button className="ai-sug" onClick={(event) => { aiSug(event.currentTarget) }}>Which rules fired most today?</button>
    <button className="ai-sug" onClick={(event) => { aiSug(event.currentTarget) }}>Are any points at risk of expiring?</button>
    <button className="ai-sug" onClick={(event) => { aiSug(event.currentTarget) }}>Why is redemption rate low?</button>
    <button className="ai-sug" onClick={(event) => { aiSug(event.currentTarget) }}>Who are my top earners?</button>
    <button className="ai-sug" onClick={(event) => { aiSug(event.currentTarget) }}>What needs attention today?</button>
  </div>
  <div className="ai-ft">
    <input type="text" className="ai-inp" id="ai-inp" placeholder="Ask about your loyalty programme…" onKeyDown={(event) => { if(event.key==='Enter')sendAI() }} />
    <button className="ai-send" onClick={(event) => { sendAI() }}>→</button>
  </div>
</div>
<button className="ai-fab" id="ai-fab" onClick={(event) => { toggleAI() }}>✦</button>
<div className="toast" id="toast"></div>



    </>
  );
};

export default LoyaltyDashboardHtml;
