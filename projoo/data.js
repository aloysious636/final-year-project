// Species configuration: DEFAULT values (editable in Settings). Adjust to breed, system and local veterinary advice.
// To add a species (e.g. rabbit, camel) add one more object here - no other code changes needed.
const SPECIES={
cattle:{label:'Cattle',term:'calving',gest:283,cycle:21,pd:60,steam:21,dry:60,flush:null,puberty:'12-18 months',wean:180,adgLow:0.4,signs:['Standing to be mounted','Restlessness','Increased activity','Mounting others','Clear vulvar mucus','Reduced feed intake']},
goat:{label:'Goat',term:'kidding',gest:150,cycle:21,pd:45,steam:null,dry:null,flush:{before:21,after:21},puberty:'5-8 months',wean:90,adgLow:0.05,signs:['Tail flagging','Vocalising','Restlessness','Mucus discharge','Mounting others']},
sheep:{label:'Sheep',term:'lambing',gest:147,cycle:17,pd:45,steam:null,dry:null,flush:{before:21,after:21},puberty:'6-9 months',wean:90,adgLow:0.07,signs:['Standing for ram','Restlessness','Tail wagging','Swollen vulva']},
pig:{label:'Pig',term:'farrowing',gest:114,cycle:21,pd:28,steam:null,dry:null,flush:{before:14,after:0},puberty:'5-7 months',wean:28,adgLow:0.4,signs:['Standing reflex (back pressure)','Swollen red vulva','Restlessness','Reduced appetite']},
poultry:{label:'Poultry',term:'hatching',gest:null,cycle:null,pd:null,steam:null,dry:null,flush:null,puberty:'18-22 weeks (lay)',wean:null,adgLow:0,signs:[]}};
function seed(){const ago=n=>addD(TODAY,-n),fut=n=>addD(TODAY,n),w=(n,kg)=>({date:ago(n),kg});
const m=(id,sp,breed,sex,days,o={})=>({id,tag:'T'+id.slice(-3),name:'',species:sp,breed,sex,dob:ago(days),group:'',status:'Breeding stock',count:null,health:[],vacc:[],weights:[],births:[],...o});
const A=[
m('COW-024','cattle','Friesian','F',1280,{name:'Wanjiru',dairy:true,lactating:true,group:'Lactating cows',pregnant:true,service:ago(270),method:'AI',lastHeat:ago(291),bcs:3,vacc:[{kind:'vacc',name:'FMD',target:'Foot and mouth',date:ago(150),next:fut(20)}]}),
m('COW-011','cattle','Friesian','F',2100,{name:'Achieng',dairy:true,lactating:true,group:'Lactating cows',pregnant:true,service:ago(215),method:'AI',bcs:3.25}),
m('COW-031','cattle','Ayrshire','F',1500,{dairy:true,lactating:true,group:'Lactating cows',lastHeat:ago(15),bcs:2.5}),
m('COW-018','cattle','Boran','F',1800,{group:'Beef herd',pregnant:true,service:ago(290),method:'Natural',sire:'BULL-002',bcs:2.75}),
m('BULL-002','cattle','Boran','M',1000,{group:'Beef herd',health:[{disease:'Suspected tick-borne disease',drug:'Per vet prescription',start:ago(3),end:fut(2),wd:14,vet:'Local vet',outcome:'Recovering',signs:'Fever'}]}),
m('CALF-007','cattle','Friesian','F',120,{group:'Calves',status:'Replacement',weights:[w(60,45),w(30,57),w(0,70)]}),
m('GOAT-017','goat','Galla','F',900,{group:'Breeding goats',pregnant:true,service:ago(138),method:'Natural',sire:'GOAT-009',bcs:3}),
m('GOAT-021','goat','Toggenburg','F',1000,{dairy:true,lactating:true,group:'Breeding goats',lastHeat:ago(18),bcs:2.5}),
m('GOAT-004','goat','Small East African','F',700,{group:'Breeding goats',plannedBreeding:fut(25),bcs:2.5}),
m('GOAT-009','goat','Boer','M',800,{group:'Breeding goats'}),
m('GOAT-030','goat','Galla','F',90,{group:'Kids',status:'Under observation',weights:[w(60,6),w(30,6.8),w(0,7.2)]}),
m('SHEEP-011','sheep','Dorper','F',1100,{group:'Breeding ewes',pregnant:true,service:ago(100),method:'Natural',vacc:[{kind:'vacc',name:'Enterotoxaemia',target:'Clostridial',date:ago(170),next:fut(5)}],bcs:3}),
m('SHEEP-014','sheep','Red Maasai','F',800,{group:'Breeding ewes',lastHeat:ago(10)}),
m('SHEEP-002','sheep','Dorper','M',900,{group:'Breeding ewes'}),
m('SHEEP-020','sheep','Dorper','F',600,{group:'Breeding ewes',plannedBreeding:fut(30),bcs:2.5}),
m('SHEEP-025','sheep','Red Maasai','F',100,{group:'Weaner sheep',weights:[w(40,10),w(0,14.5)]}),
m('PIG-005','pig','Large White','F',700,{group:'Sows',pregnant:true,service:ago(105),method:'AI'}),
m('PIG-008','pig','Landrace','F',600,{group:'Sows',service:ago(10),method:'AI'}),
m('PIG-012','pig','Large White','F',650,{group:'Sows',lastHeat:ago(19)}),
m('PIG-001','pig','Duroc','M',900,{group:'Boars'}),
m('PIG-040','pig','Landrace','M',110,{group:'Grower pigs',status:'Under observation',weights:[w(30,30),w(0,52)]}),
m('FLOCK-A','poultry','Kuroiler','F',150,{name:'Layer flock A',group:'Layers',count:200,vacc:[{kind:'vacc',name:'Newcastle disease',target:'Newcastle',date:ago(80),next:fut(4)}]})];
return{farm:{name:'Demo Farm, Tharaka-Nithi'},species:JSON.parse(JSON.stringify(SPECIES)),animals:A,taskStatus:{},resched:{}}}
