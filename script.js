const cats=[{k:"Necesidades",p:45,c:"--n"},{k:"Ahorro",p:25,c:"--a"},{k:"Crecimiento",p:15,c:"--c"},{k:"Libre",p:15,c:"--l"}];
const $=id=>document.getElementById(id);
// Montos en pesos: el punto es separador de miles y la coma es decimal
const num=s=>parseFloat(String(s).replace(/\./g,"").replace(",","."))||0;
// Porcentajes: aceptan punto o coma como decimal
const pct=s=>parseFloat(String(s).replace(",","."))||0;
const fmt=n=>"$ "+Math.round(n).toLocaleString("es-CO");
const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
 
$("cfg").innerHTML=cats.map((c,i)=>`<div style="--col:var(${c.c})"><label for="p${i}">${c.k}</label><input id="p${i}" inputmode="decimal" value="${c.p}"></div>`).join("");
 
$("cards").innerHTML=cats.map((c,i)=>`<div class="box"><div class="t"><i style="background:var(${c.c})"></i>${c.k}</div><b id="v${i}"></b><small id="x${i}"></small><div class="bar"><span><i id="b${i}" style="background:var(${c.c})"></i></span><small id="pc${i}" style="color:var(${c.c})"></small></div></div>`).join("");
 
// ---- Dona en SVG: un círculo por cada color ----
const NS="http://www.w3.org/2000/svg", R=93, C=2*Math.PI*R;
const svg=document.createElementNS(NS,"svg");
svg.setAttribute("viewBox","0 0 216 216");
const pista=document.createElementNS(NS,"circle");
pista.setAttribute("cx",108);pista.setAttribute("cy",108);pista.setAttribute("r",R);
pista.style.stroke="var(--line)";
svg.appendChild(pista);
const segs=cats.map((c,i)=>{
  const s=document.createElementNS(NS,"circle");
  s.setAttribute("cx",108);s.setAttribute("cy",108);s.setAttribute("r",R);
  s.setAttribute("transform","rotate(-90 108 108)");
  s.style.stroke=`var(${c.c})`;
  svg.appendChild(s);
  return s;
});
$("ring").prepend(svg);
const etiqueta=$("ring").querySelector("small");
 
let resumen="";
let datos=[];
let actual=cats.map(()=>0);
let hover=-1;
let raf=0;
 
function pintar(vals){
  const tot=vals.reduce((a,b)=>a+b,0);
  let acc=0;
  vals.forEach((v,i)=>{
    const len=tot?v/tot*C:0;
    segs[i].style.strokeDasharray=`${len} ${C-len}`;
    segs[i].style.strokeDashoffset=-acc;
    acc+=len;
    $("v"+i).textContent=fmt(v);
    $("b"+i).style.width=(tot?v/tot*100:0)+"%";
  });
  if(hover>=0){
    etiqueta.textContent=cats[hover].k;
    $("total").textContent=fmt(vals[hover]);
  }else{
    etiqueta.textContent="Distribuido";
    $("total").textContent=fmt(tot);
  }
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
 
// ---- Resaltar un color (desde la dona o desde su tarjeta) ----
function setHover(i){
  hover=i;
  segs.forEach((s,k)=>s.classList.toggle("on",k===i));
  $("ring").classList.toggle("hov",i>=0);
  pintar(actual);
}
 
const tip=document.createElement("div");
tip.id="tip";
document.body.appendChild(tip);
const ocultarTip=()=>{tip.style.opacity=0};
 
function mostrar(e,i){
  setHover(i);
  const s=datos[i];
  tip.innerHTML=`<b><i class="dot" style="background:var(${s.c})"> </i>${s.k}</b>${fmt(s.v)} · ${s.pct.toFixed(1).replace(".",",")}%`;
  tip.style.left=Math.min(e.clientX+14,innerWidth-tip.offsetWidth-8)+"px";
  tip.style.top=Math.max(e.clientY-56,8)+"px";
  tip.style.opacity=1;
}
 
segs.forEach((s,i)=>{
  s.addEventListener("pointerenter",e=>mostrar(e,i));
  s.addEventListener("pointermove",e=>mostrar(e,i));
  s.addEventListener("pointerdown",e=>mostrar(e,i));
  s.addEventListener("pointerleave",()=>{ocultarTip();setHover(-1)});
});
 
document.querySelectorAll("#cards .box").forEach((b,i)=>{
  b.addEventListener("pointerenter",()=>setHover(i));
  b.addEventListener("pointerleave",()=>setHover(-1));
});
 
// ---- Cálculo ----
function calc(){
  const monto=num($("monto").value);
  const extra=Math.min(num($("horas").value)*num($("vh").value),monto);
  const base=monto-extra;
  const pcts=cats.map((c,i)=>pct($("p"+i).value));
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
 
calc();