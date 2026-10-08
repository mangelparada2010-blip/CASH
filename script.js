const cats=[{k:"Necesidades",p:45,c:"--n"},{k:"Ahorro",p:25,c:"--a"},{k:"Crecimiento",p:15,c:"--c"},{k:"Libre",p:15,c:"--l"}];
const $=id=>document.getElementById(id);
const num=s=>parseFloat(String(s).replace(/\./g,"").replace(",","."))||0;
const fmt=n=>"$ "+Math.round(n).toLocaleString("es-CO");
const col=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();

$("cfg").innerHTML=cats.map((c,i)=>`<div style="--col:var(${c.c})"><label for="p${i}"><i class="dot"></i>${c.k} %</label><input id="p${i}" inputmode="decimal" value="${c.p}"></div>`).join("");

let resumen="";
let datos=[];

function calc(){
  const monto=num($("monto").value);
  const extra=Math.min(num($("horas").value)*num($("vh").value),monto);
  const base=monto-extra;
  const pcts=cats.map((c,i)=>num($("p"+i).value));
  const suma=pcts.reduce((a,b)=>a+b,0);
  const vals=pcts.map(p=>base*p/100); vals[1]+=extra;
  const tot=vals.reduce((a,b)=>a+b,0);
  datos=vals.map((v,i)=>({k:cats[i].k,v,c:cats[i].c,pct:tot?v/tot*100:0}));
  let acc=0,stops=[];
  vals.forEach((v,i)=>{const s=tot?acc/tot*100:0;acc+=v;const e=tot?acc/tot*100:0;stops.push(`${col(cats[i].c)} ${s}% ${e}%`)});
  $("ring").style.background=tot?`conic-gradient(${stops.join(",")})`:col("--line");
  $("total").textContent=fmt(tot);
  $("cards").innerHTML=cats.map((c,i)=>`<div class="box"><div class="t"><i style="background:var(${c.c})"></i>${c.k}</div><b>${fmt(vals[i])}</b>${i===1&&extra>0?`<small>incluye ${fmt(extra)} de horas extra</small>`:""}<div class="bar"><span><i style="width:${tot?vals[i]/tot*100:0}%;background:var(${c.c})"></i></span><small style="color:var(${c.c})">${pcts[i]}%</small></div></div>`).join("");
  const ok=Math.abs(suma-100)<0.001, e=$("estado");
  e.className="state"+(ok?"":" bad");
  e.textContent=ok?"Tus porcentajes suman 100%.":`Tus porcentajes suman ${suma}%. Ajústalos para llegar a 100%.`;
  resumen=`Ingreso: ${fmt(monto)}\n`+cats.map((c,i)=>`${c.k}: ${fmt(vals[i])}`).join("\n");
}

document.querySelectorAll("input").forEach(i=>i.addEventListener("input",calc));

$("copiar").onclick=async()=>{const b=$("copiar");try{await navigator.clipboard.writeText(resumen);b.textContent="Resumen copiado"}catch(e){b.textContent="No se pudo copiar"}setTimeout(()=>b.textContent="Copiar resumen",1800)};

const tip=document.createElement("div");
tip.id="tip";
document.body.appendChild(tip);
const ocultar=()=>{tip.style.opacity=0};

function mostrar(e){
  const r=$("ring").getBoundingClientRect();
  const dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
  const d=Math.hypot(dx,dy), R=r.width/2, hueco=R*156/216;
  if(d>R||d<hueco)return ocultar();
  let a=Math.atan2(dx,-dy); if(a<0)a+=2*Math.PI;
  const p=a/(2*Math.PI)*100;
  let acc=0;
  for(const s of datos){
    acc+=s.pct;
    if(p<=acc){
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