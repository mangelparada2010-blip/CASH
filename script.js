const cats=[{k:"Necesidades",p:45,c:"--n"},{k:"Ahorro",p:25,c:"--a"},{k:"Crecimiento",p:15,c:"--c"},{k:"Libre",p:15,c:"--l"}];
const $=id=>document.getElementById(id);
const num=s=>parseFloat(String(s).replace(/\./g,"").replace(",","."))||0;
const fmt=n=>"$ "+Math.round(n).toLocaleString("es-CO");
const col=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const rgba=(hex,a)=>{const h=hex.replace("#","");return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`};
const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;

$("cfg").innerHTML=cats.map((c,i)=>`<div style="--col:var(${c.c})"><label for="p${i}"><i class="dot"></i>${c.k} %</label><input id="p${i}" inputmode="decimal" value="${c.p}"></div>`).join("");

$("cards").innerHTML=cats.map((c,i)=>`<div class="box"><div class="t"><i style="background:var(${c.c})"></i>${c.k}</div><b id="v${i}"></b><small id="x${i}"></small><div class="bar"><span><i id="b${i}" style="background:var(${c.c})"></i></span><small id="pc${i}" style="color:var(${c.c})"></small></div></div>`).join("");

const etiqueta=$("ring").querySelector("small");

let resumen="";
let datos=[];
let actual=cats.map(()=>0);
let op=cats.map(()=>1);   // opacidad actual de cada tramo
let hover=-1;             // tramo bajo el mouse (-1 = ninguno)
let raf=0, rafH=0;

function pintar(vals){
  const tot=vals.reduce((a,b)=>a+b,0);
  let acc=0,stops=[];
  vals.forEach((v,i)=>{
    const s=tot?acc/tot*100:0;acc+=v;const e=tot?acc/tot*100:0;
    stops.push(`${rgba(col(cats[i].c),op[i])} ${s}% ${e}%`);
  });
  $("ring").style.background=tot?`conic-gradient(${stops.join(",")})`:col("--line");
  if(hover>=0){
    etiqueta.textContent=cats[hover].k;
    $("total").textContent=fmt(vals[hover]);
  }else{
    etiqueta.textContent="Distribuido";
    $("total").textContent=fmt(tot);
  }
  vals.forEach((v,i)=>{
    $("v"+i).textContent=fmt(v);
    $("b"+i).style.width=(tot?v/tot*100:0)+"%";
  });
}

function animar(destino){
  cancelAnimationFrame(raf);
  if(reduce()){actual=[...destino];pintar(actual);return;}
  const desde=[...actual], t0=performance.now(), dur=650;
  const paso=t=>{
    const k=Math.min((t-t0)/dur,1), e=1-Math.pow(1-k,3);
    actual=destino.map((d,i)=>desde[i]+(d-desde[i])*e);
    pintar(actual);
    if(k<1)raf=requestAnimationFrame(paso);
  };
  raf=requestAnimationFrame(paso);
}

function setHover(i){
  if(i===hover)return;
  hover=i;
  cancelAnimationFrame(rafH);
  const destino=cats.map((_,k)=>(i===-1||i===k)?1:0.3);
  if(reduce()){op=destino;pintar(actual);return;}
  const desde=[...op], t0=performance.now(), dur=220;
  const paso=t=>{
    const k=Math.min((t-t0)/dur,1);
    op=destino.map((d,j)=>desde[j]+(d-desde[j])*k);
    pintar(actual);
    if(k<1)rafH=requestAnimationFrame(paso);
  };
  rafH=requestAnimationFrame(paso);
}

function calc(){
  const monto=num($("monto").value);
  const extra=Math.min(num($("horas").value)*num($("vh").value),monto);
  const base=monto-extra;
  const pcts=cats.map((c,i)=>num($("p"+i).value));
  const suma=pcts.reduce((a,b)=>a+b,0);
  const vals=pcts.map(p=>base*p/100); vals[1]+=extra;
  const tot=vals.reduce((a,b)=>a+b,0);
  datos=vals.map((v,i)=>({k:cats[i].k,v,c:cats[i].c,pct:tot?v/tot*100:0}));

  cats.forEach((c,i)=>{$("pc"+i).textContent=pcts[i]+"%"});
  $("x1").textContent=extra>0?`incluye ${fmt(extra)} de horas extra`:"";

  const ok=Math.abs(suma-100)<0.001, e=$("estado");
  e.className="state"+(ok?"":" bad");
  e.textContent=ok?"Tus porcentajes suman 100%.":`Tus porcentajes suman ${suma}%. Ajústalos para llegar a 100%.`;
  resumen=`Ingreso: ${fmt(monto)}\n`+cats.map((c,i)=>`${c.k}: ${fmt(vals[i])}`).join("\n");

  animar(vals);
}

document.querySelectorAll("input").forEach(i=>i.addEventListener("input",calc));

$("copiar").onclick=async()=>{const b=$("copiar");try{await navigator.clipboard.writeText(resumen);b.textContent="Resumen copiado"}catch(e){b.textContent="No se pudo copiar"}setTimeout(()=>b.textContent="Copiar resumen",1800)};

const tip=document.createElement("div");
tip.id="tip";
document.body.appendChild(tip);
const ocultar=()=>{tip.style.opacity=0;setHover(-1)};

function mostrar(e){
  const r=$("ring").getBoundingClientRect();
  const dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
  const d=Math.hypot(dx,dy), R=r.width/2, hueco=R*156/216;
  if(d>R||d<hueco)return ocultar();
  let a=Math.atan2(dx,-dy); if(a<0)a+=2*Math.PI;
  const p=a/(2*Math.PI)*100;
  let acc=0;
  for(let i=0;i<datos.length;i++){
    const s=datos[i];
    acc+=s.pct;
    if(p<=acc){
      setHover(i);
      tip.innerHTML=`<b><i class="dot" style="background:var(${s.c})"></i>${s.k}</b>${fmt(s.v)} · ${s.pct.toFixed(1).replace(".",",")}%`;
      tip.style.left=Math.min(e.clientX+14,innerWidth-tip.offsetWidth-8)+"px";
      tip.style.top=Math.max(e.clientY-56,8)+"px";
      tip.style.opacity=1;
      return;
    }
  }
  ocultar();
}

$("ring").addEventListener("pointermove",mostrar);
$("ring").addEventListener("pointerdown",mostrar);
$("ring").addEventListener("pointerleave",ocultar);

calc();