const $=s=>document.querySelector(s);
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const TODAY=iso(new Date()),pd=s=>new Date(s+'T00:00:00');
const addD=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return iso(d)};
const diff=s=>Math.round((pd(s)-pd(TODAY))/864e5),fmt=s=>s?pd(s).toLocaleDateString('en-GB'):'—';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function age(dob){if(!dob)return'Unknown';const a=pd(dob),b=pd(TODAY);let y=b.getFullYear()-a.getFullYear(),m=b.getMonth()-a.getMonth(),d=b.getDate()-a.getDate();if(d<0){m--;d+=new Date(b.getFullYear(),b.getMonth(),0).getDate()}if(m<0){y--;m+=12}return`${y}y ${m}m ${d}d`}
let S=Store.load(),view='dashboard',F={q:'',sp:'',f:''};
const save=()=>Store.save(S),find=id=>S.animals.find(a=>a.id===id),cfg=a=>S.species[a.species];
const exp=a=>a.pregnant&&a.service&&cfg(a).gest?(a.expOverride||addD(a.service,cfg(a).gest)):null;
function stage(d){return d<0?['Overdue','red','🔴']:d===0?['Due today','red','🔴']:d<=7?['Due soon','orange','🟠']:d<=21?['Approaching','yellow','🟡']:['Normal','green','🟢']}
const badge=(t,c)=>`<span class="b ${c}">${t}</span>`,sb=d=>{const[l,c,i]=stage(d);return badge(i+' '+l,c)};
function nextHeat(a){const c=cfg(a);if(a.sex!=='F'||a.pregnant||!c.cycle||!a.lastHeat)return null;let n=addD(a.lastHeat,c.cycle);while(diff(n)<0)n=addD(n,c.cycle);return n}
const wdEnd=t=>t.wd&&(t.end||t.start)?addD(t.end||t.start,+t.wd):null,underTx=a=>(a.health||[]).some(t=>!t.end||diff(t.end)>=0);
function adg(a){const w=[...a.weights].sort((x,y)=>x.date<y.date?-1:1);if(w.length<2)return null;const f=w[0],l=w[w.length-1],d=(pd(l.date)-pd(f.date))/864e5;return d>0?(l.kg-f.kg)/d:null}
function growth(a){const g=adg(a);if(g===null)return['No data','grey'];return g<0?['Losing weight','red']:g<cfg(a).adgLow?['Growing slowly','orange']:['Growing normally','green']}
function tasks(){const T=[],add=(id,task,a,due,k)=>{if(!due)return;const dd=S.resched[id]||due,d=diff(dd);T.push({id,task,k:k||'task',animal:a.id,species:cfg(a).label,due:dd,d,st:S.taskStatus[id]||'Pending',pr:d<=3?'High':d<=14?'Medium':'Low'})};
S.animals.forEach(a=>{const c=cfg(a),e=exp(a);
if(e){add(a.id+'-prep:'+e,`${c.term} preparation (clean pen, supplies, monitor)`,a,addD(e,-14));
if(c.steam&&a.dairy)add(a.id+'-steam:'+e,`Start steaming-up (late-pregnancy feeding), ~${c.steam} d before ${c.term}`,a,addD(e,-c.steam));
if(c.dry&&a.dairy)add(a.id+'-dry:'+e,'Dry-off (~'+c.dry+' d before calving)',a,addD(e,-c.dry))}
if(a.service&&!a.pregnant&&c.pd)add(a.id+'-pd:'+a.service,'Pregnancy diagnosis',a,addD(a.service,c.pd));
if(a.plannedBreeding&&c.flush)add(a.id+'-flush:'+a.plannedBreeding,'Start flushing (if animal/BCS warrants)',a,addD(a.plannedBreeding,-c.flush.before));
const h=nextHeat(a);if(h)add(a.id+'-heat:'+h,'Observe for heat (estimated date)',a,h);
const nx={};(a.vacc||[]).forEach(v=>{if(v.next&&(!nx[v.name]||v.next>nx[v.name].next))nx[v.name]=v});
Object.values(nx).forEach(v=>add(a.id+'-v:'+v.name+v.next,(v.kind==='deworm'?'Parasite assessment/treatment: ':'Vaccination: ')+v.name,a,v.next,v.kind==='deworm'?'deworm':'vacc'))});
return T.sort((x,y)=>x.d-y.d)}
const open_=t=>t.st==='Pending'||t.st==='Rescheduled';
function alerts(){const L=[],when=d=>d<0?-d+' days overdue':d===0?'today':'in '+d+' days';
S.animals.forEach(a=>{const e=exp(a);if(e){const d=diff(e);L.push({d,lv:d<0?'URGENT':d<=14?'ACTION REQUIRED':'UPCOMING',c:d<0?'red':d<=14?'orange':'yellow',t:`${a.id} expected ${cfg(a).term} ${when(d)} (${fmt(e)}, estimated)`})}
(a.health||[]).forEach(t=>{const w=wdEnd(t);if(w&&diff(w)>=0)L.push({d:diff(w),lv:'WITHDRAWAL',c:'orange',t:`${a.id}: withdrawal ends ${fmt(w)} - follow label/vet`})})});
tasks().filter(t=>open_(t)&&t.d<=14&&!/preparation/.test(t.task)).forEach(t=>L.push({d:t.d,lv:t.d<0?'URGENT':t.d<=7?'ACTION REQUIRED':'UPCOMING',c:t.d<0?'red':t.d<=7?'orange':'yellow',t:`${t.task} - ${t.animal} (${when(t.d)})`}));
return L.sort((x,y)=>x.d-y.d)}
function score(a){let s=0;const T=tasks().filter(t=>t.animal===a.id&&open_(t)),e=exp(a);s+=2*T.filter(t=>t.d<0).length;if(e&&diff(e)<=7)s+=3;if(underTx(a))s+=2;if(a.bcs&&a.bcs<2.5)s+=2;const g=adg(a);if(g!==null&&g<0)s+=2;return s}
const scoreB=s=>s>=4?badge('High ('+s+')','red'):s>=2?badge('Moderate ('+s+')','yellow'):badge('Low ('+s+')','green');
function status(a){return exp(a)?'Pregnant':a.service&&!a.pregnant?'Served (awaiting PD)':a.sex==='M'?'Male':a.lactating?'Lactating, open':'Open'}
// ---------- forms ----------
function openForm(title,fields,vals,onSave){const d=$('#dlg');
const h=fields.map(([n,l,t,o])=>{const v=vals[n]??'';let i;
if(t==='select')i=`<select name="${n}">${o.map(x=>`<option value="${x[0]}" ${x[0]==v?'selected':''}>${esc(x[1])}</option>`).join('')}</select>`;
else if(t==='check')i=`<input type="checkbox" name="${n}" ${v?'checked':''}>`;
else i=`<input type="${t}" name="${n}" value="${esc(v)}" ${t==='number'?'step="any"':''}>`;
return`<label>${l}${i}</label>`}).join('');
d.innerHTML=`<form id="f"><h3>${title}</h3><div class="grid">${h}</div><p id="err" class="err"></p><div class="row"><button class="btn">Save</button><button type="button" class="btn ghost" onclick="$('#dlg').close()">Cancel</button></div></form>`;
d.showModal();$('#f').onsubmit=e=>{e.preventDefault();const o={};fields.forEach(([n,,t])=>{const el=$('#f').elements[n];o[n]=t==='check'?el.checked:t==='number'?(el.value===''?null:+el.value):el.value});
const er=onSave(o);if(er)$('#err').textContent='⚠ '+er;else{d.close();render()}}}
const ST=['Breeding stock','Replacement','Under observation','Candidate for culling','Sold','Deceased'].map(x=>[x,x]);
function animalForm(id){const old=id?find(id):null;
openForm(old?'Edit animal':'Register animal',[['id','Animal ID *','text'],['tag','Tag number','text'],['name','Name','text'],['species','Species','select',Object.keys(S.species).map(k=>[k,S.species[k].label])],['breed','Breed','text'],['sex','Sex','select',[['F','Female'],['M','Male']]],['dob','Date of birth (optional)','date'],['group','Group / location','text'],['status','Management status','select',ST],['dam','Dam ID','text'],['sire','Sire ID','text'],['source','Source','text'],['count','Flock size (poultry/group)','number'],['bcs','Body condition score (1-5)','number'],['dairy','Dairy animal','check'],['lactating','Lactating','check']],old||{sex:'F',species:'cattle',status:'Breeding stock'},o=>{
if(!o.id)return'Animal ID is required.';if(!/^[\w-]+$/.test(o.id))return'ID: letters, numbers, - or _ only.';
if((!old||old.id!==o.id)&&find(o.id))return'That Animal ID already exists.';if(o.dob&&o.dob>TODAY)return'Date of birth cannot be in the future.';
if(o.bcs!=null&&(o.bcs<1||o.bcs>5))return'BCS must be between 1 and 5.';if(o.count!=null&&o.count<0)return'Number of animals cannot be negative.';
if(o.sex==='M'&&old&&old.pregnant)return'A male cannot be recorded as pregnant.';
if(old)Object.assign(old,o);else S.animals.push({...o,health:[],vacc:[],weights:[],births:[]});save()})}
function breedForm(id){const a=find(id);openForm('Breeding record - '+a.id,[['lastHeat','Last observed heat','date'],['service','Service date','date'],['method','Service method','select',[['','-'],['Natural','Natural mating'],['AI','Artificial insemination'],['Other','Other']]],['sire','Sire / semen used','text'],['services','Number of services','number'],['pregnant','Pregnancy confirmed','check'],['expOverride','Override expected birth date','date'],['plannedBreeding','Planned breeding date (flushing)','date'],['actualBirth','Actual birth date (closes pregnancy)','date'],['offspring','Number of offspring','number'],['bcs','BCS (1-5)','number'],['remarks','Reproductive remarks','text']],a,o=>{
if(a.sex!=='F'&&(o.pregnant||o.service))return'Only females can have service or pregnancy records.';
if(o.service&&o.service>TODAY)return'Service date cannot be in the future.';if(o.service&&a.dob&&o.service<a.dob)return'Service date cannot be before birth.';
if(o.pregnant&&!o.service)return'Enter the service date to calculate the expected birth date.';
if(o.actualBirth&&(!o.service||o.actualBirth<o.service))return'Actual birth date cannot be before the service date.';
if(o.offspring!=null&&o.offspring<0)return'Number of offspring cannot be negative.';if(o.bcs!=null&&(o.bcs<1||o.bcs>5))return'BCS must be 1-5.';
if(o.actualBirth){a.births.push({date:o.actualBirth,n:o.offspring||0});o.pregnant=false;o.service='';o.expOverride='';o.actualBirth=''}
Object.assign(a,o);save()})}
function recForm(type,id){const A=['id','Animal','select',S.animals.map(a=>[a.id,a.id+' '+(a.name||'')])];
const D={tx:[A,['disease','Disease / condition','text'],['signs','Clinical signs','text'],['drug','Drug / product','text'],['dose','Dose','text'],['route','Route','text'],['start','Treatment start','date'],['end','Treatment end','date'],['wd','Withdrawal period (days) - from label/vet','number'],['vet','Veterinarian / animal-health professional','text'],['outcome','Outcome','text']],
vx:[A,['kind','Type','select',[['vacc','Vaccination'],['deworm','Deworming / parasite control']]],['name','Vaccine / product','text'],['target','Disease / parasite targeted','text'],['date','Date administered','date'],['next','Next due / assessment date','date'],['dose','Dose','text'],['batch','Batch no. / active ingredient','text']],
wt:[A,['date','Date','date'],['kg','Weight (kg)','number']]};
openForm({tx:'Treatment record',vx:'Vaccination / parasite control',wt:'Weight record'}[type],D[type],{id,date:TODAY,start:TODAY,kind:'vacc'},o=>{const a=find(o.id);
if(type==='wt'){if(!o.kg||o.kg<=0)return'Weight must be a positive number.';if(!o.date||o.date>TODAY)return'Enter a valid, non-future date.';if(a.dob&&o.date<a.dob)return'Weight date cannot be before birth.';a.weights.push({date:o.date,kg:o.kg})}
else if(type==='tx'){if(!o.disease)return'Disease/condition is required.';if(!o.start)return'Treatment start date is required.';if(o.end&&o.end<o.start)return'End date cannot be before start date.';if(o.wd!=null&&o.wd<0)return'Withdrawal period cannot be negative.';a.health.push(o)}
else{if(!o.name||!o.date)return'Product name and date are required.';if(o.date>TODAY)return'Date administered cannot be in the future.';if(o.next&&o.next<=o.date)return'Next date must be after the administration date.';a.vacc.push(o)}
save()})}
function del(id){if(confirm('Delete '+id+' and all its records?')){S.animals=S.animals.filter(a=>a.id!==id);save();$('#dlg').close();render()}}
// ---------- profile ----------
function chart(a){const w=[...a.weights].sort((x,y)=>x.date<y.date?-1:1);if(w.length<2)return'<p>Add 2+ weights to see a growth trend.</p>';
const mx=Math.max(...w.map(p=>p.kg)),mn=Math.min(...w.map(p=>p.kg)),X=i=>20+i*(360/(w.length-1)),Y=k=>110-(k-mn)/((mx-mn)||1)*90;
return`<svg viewBox="0 0 400 130" width="100%"><polyline fill="none" stroke="#2f6b3f" stroke-width="2" points="${w.map((p,i)=>X(i)+','+Y(p.kg)).join(' ')}"/>${w.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.kg)}" r="3"/><text x="${X(i)}" y="${Y(p.kg)-6}" font-size="9" text-anchor="middle">${p.kg}kg</text>`).join('')}</svg>`}
function profile(id){const a=find(id),c=cfg(a),e=exp(a),h=nextHeat(a),g=growth(a),ad=adg(a);
const ev=[...a.births.map(b=>[b.date,`Birth event: ${b.n} offspring`]),...a.health.map(t=>[t.start,`Treatment: ${t.disease} (${t.drug||'-'})`]),...a.vacc.map(v=>[v.date,`${v.kind==='deworm'?'Parasite control':'Vaccination'}: ${v.name}`]),...a.weights.map(w=>[w.date,`Weight ${w.kg} kg`])].sort((x,y)=>x[0]<y[0]?1:-1);
const lastOf=k=>{const l=a.vacc.filter(v=>v.kind===k).sort((x,y)=>x.date<y.date?1:-1)[0];return l?l.name+' ('+fmt(l.date)+')':'-'};
$('#dlg').innerHTML=`<h2>${a.id} ${esc(a.name)}</h2><div class="row"><button class="btn" onclick="animalForm('${a.id}')">Edit</button><button class="btn ghost" onclick="breedForm('${a.id}')">Breeding</button><button class="btn ghost" onclick="recForm('wt','${a.id}')">+Weight</button><button class="btn ghost" onclick="recForm('tx','${a.id}')">+Treatment</button><button class="btn ghost" onclick="recForm('vx','${a.id}')">+Vaccine/Deworm</button><button class="btn ghost" onclick="window.print()">Print</button><button class="btn del" onclick="del('${a.id}')">Delete</button><button class="btn ghost" onclick="$('#dlg').close()">Close</button></div>
<div class="box"><b>Identity</b><br>${c.label} - ${esc(a.breed)} - ${a.sex==='F'?'Female':'Male'} - Tag ${esc(a.tag)}<br>DOB: ${fmt(a.dob)} (<i>calculated</i> age: ${age(a.dob)}) - Group: ${esc(a.group)||'-'} - ${a.status}${a.count?' - Flock size '+a.count:''}</div>
<div class="box"><b>Reproduction</b> <small>(calculated values are estimates)</small><br>Status: ${status(a)} - Last heat: ${fmt(a.lastHeat)} - Service: ${fmt(a.service)} ${a.method||''}<br>${e?`Expected ${c.term}: <b>${fmt(e)}</b> - ${diff(e)} days remaining ${sb(diff(e))}`:''}${h?`Estimated next heat: <b>${fmt(h)}</b> (in ${diff(h)} days; estimate only, not a guarantee)`:''}<br>Births recorded: ${a.births.length}${c.signs.length?'<br><small>Common heat signs: '+c.signs.join(', ')+'</small>':''}</div>
<div class="box"><b>Nutrition/Health</b><br>BCS: ${a.bcs??'-'} - Last vaccination: ${lastOf('vacc')} - Last deworming: ${lastOf('deworm')} - Under treatment: ${underTx(a)?'Yes':'No'}<br>${a.health.map(t=>wdEnd(t)?`Withdrawal ends <b>${fmt(wdEnd(t))}</b> (${esc(t.drug)})`:'').join('<br>')}</div>
<div class="box"><b>Growth</b> ${badge(g[0],g[1])} ADG: ${ad===null?'n/a':ad.toFixed(3)+' kg/day'} <small>(reference threshold ${c.adgLow} kg/d is configurable)</small>${chart(a)}</div>
<div class="box"><b>Upcoming tasks</b><br>${tasks().filter(t=>t.animal===a.id&&open_(t)).map(t=>`${fmt(t.due)} - ${t.task} (${t.d} d)`).join('<br>')||'None'}</div>
<div class="box"><b>History</b><br>${ev.map(x=>fmt(x[0])+' - '+esc(x[1])).join('<br>')||'No records'}</div>`;$('#dlg').showModal()}
// ---------- views ----------
const tbl=(h,r)=>`<div class="tw"><table><tr>${h.map(x=>'<th>'+x+'</th>').join('')}</tr>${r.join('')||'<tr><td colspan="9">No records yet.</td></tr>'}</table></div>`;
const V={
dashboard(){const T=tasks(),A=S.animals,act=T.filter(open_),P=A.filter(exp),n=A.reduce((s,a)=>s+(a.count||1),0),sp={};A.forEach(a=>sp[cfg(a).label]=(sp[cfg(a).label]||0)+(a.count||1));
const C=(l,v)=>`<div class="card"><b>${v}</b><span>${l}</span></div>`,AL=alerts().slice(0,12);
return`<h2>Dashboard</h2><div class="cards">${C('Total animals',n)}${C('Pregnant',P.length)}${C('Due within 14 days',P.filter(a=>diff(exp(a))<=14).length)}${C('Heat expected ≤7 d',A.filter(a=>{const h=nextHeat(a);return h&&diff(h)<=7}).length)}${C('Tasks due ≤7 d',act.filter(t=>t.d>=0&&t.d<=7).length)}${C('Overdue tasks',act.filter(t=>t.d<0).length)}${C('Vaccinations due ≤14 d',act.filter(t=>t.k==='vacc'&&t.d<=14).length)}${C('Parasite tasks',act.filter(t=>t.k==='deworm').length)}${C('Under treatment',A.filter(underTx).length)}${C('High-priority animals',A.filter(a=>score(a)>=4).length)}</div>
<div class="box"><b>Alerts</b>${AL.map(x=>`<div class="al ${x.c}"><b>${x.lv}</b> ${esc(x.t)}</div>`).join('')||'<p>No alerts.</p>'}</div>
<div class="box"><b>Upcoming births</b>${tbl(['Animal','Species','Expected (est.)','Days','Stage'],P.sort((a,b)=>diff(exp(a))-diff(exp(b))).map(a=>`<tr class="c" onclick="profile('${a.id}')"><td>${a.id}</td><td>${cfg(a).label}</td><td>${fmt(exp(a))}</td><td>${diff(exp(a))}</td><td>${sb(diff(exp(a)))}</td></tr>`))}</div>
<div class="box"><b>Animals by species</b>${Object.entries(sp).map(([k,v])=>`<div class="bar1" style="width:${Math.max(8,v/Math.max(...Object.values(sp))*100)}%">${k}: ${v}</div>`).join('')}</div>`},
animals(){const q=F.q.toLowerCase(),f=F.f;let L=S.animals.filter(a=>(!q||[a.id,a.tag,a.name,a.breed,a.group].join(' ').toLowerCase().includes(q))&&(!F.sp||a.species===F.sp));
const T=tasks().filter(open_);
if(f==='preg')L=L.filter(exp);if(f==='due30')L=L.filter(a=>exp(a)&&diff(exp(a))<=30);if(f==='heat10')L=L.filter(a=>{const h=nextHeat(a);return h&&diff(h)<=10});if(f==='tx')L=L.filter(underTx);if(f==='od')L=L.filter(a=>T.some(t=>t.animal===a.id&&t.d<0));
return`<h2>Animals</h2><div class="bar"><input placeholder="Search ID, tag, name, breed, group" value="${esc(F.q)}" oninput="F.q=this.value;render(true)"><select onchange="F.sp=this.value;render()"><option value="">All species</option>${Object.keys(S.species).map(k=>`<option value="${k}" ${F.sp===k?'selected':''}>${S.species[k].label}</option>`).join('')}</select><select onchange="F.f=this.value;render()">${[['','All'],['preg','Pregnant'],['due30','Due within 30 days'],['heat10','Heat expected ≤10 d'],['tx','Under treatment'],['od','Overdue tasks']].map(x=>`<option value="${x[0]}" ${F.f===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select><button class="btn" onclick="animalForm()">+ Register animal</button></div>
${tbl(['ID','Name','Species','Breed','Sex','Age (calc.)','Status','Priority score*'],L.map(a=>`<tr class="c" onclick="profile('${a.id}')"><td>${a.id}</td><td>${esc(a.name)}</td><td>${cfg(a).label}</td><td>${esc(a.breed)}</td><td>${a.sex}</td><td>${age(a.dob)}</td><td>${status(a)}</td><td>${scoreB(score(a))}</td></tr>`))}<small>*Management-priority score, not a medical diagnosis.</small>`},
breeding(){const L=S.animals.filter(a=>a.sex==='F'&&cfg(a).gest);
return`<h2>Breeding, Heat, Flushing &amp; Steaming-up</h2><div class="note">All dates are <b>estimates</b> from species defaults (editable in Settings). Flushing is mainly relevant to ewes/does (and some gilts) in lean-to-moderate condition; steaming-up applies mainly to dairy cattle. Follow veterinary advice.</div>
${tbl(['Animal','Status','Last heat → Est. next heat (days)','Service','Expected birth (est.)','Days left','Stage','Flushing (est.)','Steaming-up (est.)',''],L.map(a=>{const c=cfg(a),e=exp(a),h=nextHeat(a),fl=a.plannedBreeding&&c.flush?`${fmt(addD(a.plannedBreeding,-c.flush.before))} → ${fmt(addD(a.plannedBreeding,c.flush.after))}`:c.flush?'Not planned':'Not applicable',st=c.steam&&a.dairy&&e?`Start ${fmt(addD(e,-c.steam))} (${diff(addD(e,-c.steam))} d)`:c.steam&&a.dairy?'Applies when pregnant':'Not applicable';
return`<tr><td><a href="#" onclick="profile('${a.id}');return false">${a.id}</a></td><td>${status(a)}</td><td>${fmt(a.lastHeat)} → ${h?fmt(h)+' ('+diff(h)+' d)':'-'}</td><td>${fmt(a.service)} ${a.method||''}</td><td>${e?fmt(e):'-'}</td><td>${e?diff(e):'-'}</td><td>${e?sb(diff(e)):'-'}</td><td>${fl}</td><td>${st}</td><td><button class="btn" onclick="breedForm('${a.id}')">Edit</button></td></tr>`}))}`},
health(){const tx=[],vx=[];S.animals.forEach(a=>{a.health.forEach(t=>tx.push([a.id,t]));a.vacc.forEach(v=>vx.push([a.id,v]))});
return`<h2>Health, Vaccination &amp; Parasite Control</h2><div class="bar"><button class="btn" onclick="recForm('tx')">+ Treatment</button><button class="btn" onclick="recForm('vx')">+ Vaccination / Deworming</button></div>
<div class="note">Always follow the product label and veterinary instructions. Withdrawal periods vary by product, animal, dose, route and formulation - this system never supplies them; enter the value from the label/prescription. Parasite control should be targeted (risk, clinical signs, faecal egg counts, vet advice) rather than automatic routine dosing. Vaccination programmes vary by region and disease risk - schedules here are entered by you.</div>
<h3>Treatments</h3>${tbl(['Animal','Condition','Drug','Start','End','Withdrawal ends','Outcome'],tx.map(([i,t])=>`<tr><td>${i}</td><td>${esc(t.disease)}</td><td>${esc(t.drug)}</td><td>${fmt(t.start)}</td><td>${fmt(t.end)}</td><td>${wdEnd(t)?fmt(wdEnd(t))+(diff(wdEnd(t))>=0?' '+badge('Withhold','orange'):' '+badge('Cleared','green')):'Not entered'}</td><td>${esc(t.outcome)}</td></tr>`))}
<h3>Vaccination &amp; parasite records</h3>${tbl(['Animal','Type','Product','Target','Given','Next due','Days'],vx.map(([i,v])=>`<tr><td>${i}</td><td>${v.kind==='deworm'?'Parasite':'Vaccine'}</td><td>${esc(v.name)}</td><td>${esc(v.target)}</td><td>${fmt(v.date)}</td><td>${fmt(v.next)}</td><td>${v.next?diff(v.next):'-'}</td></tr>`))}`},
calendar(){const T=tasks();return`<h2>Management Calendar</h2><div class="bar"><button class="btn" onclick="window.print()">Print</button><button class="btn ghost" onclick="csvTasks()">Export CSV</button></div>
${tbl(['Task','Animal','Species','Due','Days','Priority','Status'],T.map(t=>`<tr><td>${esc(t.task)}</td><td>${t.animal}</td><td>${t.species}</td><td>${fmt(t.due)}</td><td>${t.d<0?badge(-t.d+' d overdue','red'):t.d}</td><td>${badge(t.pr,t.pr==='High'?'red':t.pr==='Medium'?'yellow':'green')}</td><td><select onchange="setTask('${t.id}',this.value)">${['Pending','Completed','Skipped','Rescheduled'].map(s=>`<option ${s===t.st?'selected':''}>${s}</option>`).join('')}</select></td></tr>`))}`},
settings(){return`<h2>Settings &amp; Backup</h2><div class="box"><label>Farm name<input value="${esc(S.farm.name)}" onchange="S.farm.name=this.value;save();render()"></label></div>
<div class="box"><b>Species parameters</b> (defaults; edit to suit breed, system and vet advice)${tbl(['Species','Gestation (d)','Cycle (d)','Preg. diagnosis (d)','Steaming-up (d before birth)','Reference ADG (kg/d)'],Object.keys(S.species).map(k=>{const c=S.species[k],I=(f,v)=>v===null?'n/a':`<input type="number" style="width:80px" value="${v}" onchange="setSp('${k}','${f}',this.value)">`;return`<tr><td>${c.label}</td><td>${I('gest',c.gest)}</td><td>${I('cycle',c.cycle)}</td><td>${I('pd',c.pd)}</td><td>${I('steam',c.steam)}</td><td>${I('adgLow',c.adgLow)}</td></tr>`}))}</div>
<div class="box"><b>Data</b><div class="row"><button class="btn" onclick="backup()">Export backup (JSON)</button><label class="btn ghost">Import backup<input type="file" accept=".json" hidden onchange="restore(this.files[0])"></label><button class="btn ghost" onclick="csvAnimals()">Export animals (CSV)</button><button class="btn del" onclick="if(confirm('Reset to demo data?')){Store.reset();S=seed();save();render()}">Reset demo data</button></div>
<div class="note">Prototype storage uses browser localStorage: suitable for demonstration, NOT secure or enterprise-grade, and lost if browser data is cleared. Export backups regularly. A production version needs a secure database, authentication, role-based access, encryption, cloud backup, audit logs and offline sync.</div></div>`}};
function setTask(id,s){if(s==='Rescheduled'){const d=prompt('New date (YYYY-MM-DD):',TODAY);if(!/^\d{4}-\d\d-\d\d$/.test(d||''))return render();S.resched[id]=d}S.taskStatus[id]=s;save();render()}
function setSp(k,f,v){if(v===''||+v<0)return;S.species[k][f]=+v;save();render()}
function dl(n,t,m){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()}
const csv=(n,r)=>dl(n,r.map(x=>x.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n'),'text/csv');
const csvAnimals=()=>csv('animals.csv',[['ID','Tag','Name','Species','Breed','Sex','DOB','Age','Status','Group'],...S.animals.map(a=>[a.id,a.tag,a.name,a.species,a.breed,a.sex,a.dob,age(a.dob),status(a),a.group])]);
const csvTasks=()=>csv('tasks.csv',[['Task','Animal','Species','Due','Days','Priority','Status'],...tasks().map(t=>[t.task,t.animal,t.species,t.due,t.d,t.pr,t.st])]);
const backup=()=>dl('farm-backup-'+TODAY+'.json',JSON.stringify(S,null,2),'application/json');
function restore(f){if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.animals)||!d.species)throw 0;S=d;save();render();alert('Backup restored.')}catch(e){alert('Invalid backup file.')}};r.readAsText(f)}
function render(keep){const act=document.activeElement,pos=act&&act.selectionStart;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));$('#farm').textContent=S.farm.name;$('#main').innerHTML=V[view]();if(keep){const i=$('.bar input');if(i){i.focus();i.setSelectionRange(pos,pos)}}}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{view=b.dataset.v;render()});save();render();
