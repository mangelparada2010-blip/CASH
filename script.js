const cats=[{k:"Necesidades",p:45,c:"--n"},{k:"Ahorro",p:25,c:"--a"},{k:"Crecimiento",p:15,c:"--c"},{k:"Libre",p:15,c:"--l"}];
const $=id=>document.getElementById(id);
const num=s=>parseFloat(String(s).replace(/\./g,"").replace(",","."))||0;
const fmt=n=>"$ "+Math.round(n).toLocaleString("es-CO");
const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;

$("cfg").innerHTML=cats.map((c,i)=>`<div style="--col:var(${c.c})"><label for="p${i}"><i class="dot"></i></label>${c.k} <input id="p${i}" inputmode="decimal" value="${c.p}"></div>`).join("");

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
let datos=[]; let ultimo=null;
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
  tip.innerHTML=`<b><i class="dot" style="background:var(${s.c})"></i>${s.k}</b>${fmt(s.v)} · ${s.pct.toFixed(1).replace(".",",")}%`;
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
  const pcts=cats.map((c,i)=>num($("p"+i).value));
  const suma=pcts.reduce((a,b)=>a+b,0);
  const vals=pcts.map(p=>base*p/100); vals[1]+=extra;
  const tot=vals.reduce((a,b)=>a+b,0);
  datos=vals.map((v,i)=>({k:cats[i].k,v,c:cats[i].c,pct:tot?v/tot*100:0}));
    ultimo={monto,extra,pcts,vals,tot};

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

async function cargarLogo(){
  try{
    const img=new Image();
    img.src="logo.png";
    await img.decode();
    const c=document.createElement("canvas");
    c.width=img.naturalWidth;c.height=img.naturalHeight;
    c.getContext("2d").drawImage(img,0,0);
    return c.toDataURL("image/png");
  }catch(e){return null}
}

async function descargarPDF(){
  if(!ultimo||!window.jspdf)return;
  const btn=$("pdf"), txt=btn.textContent;
  btn.textContent="Generando...";
  try{
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:"mm",format:"a4"});
    const W=210, M=18, R=W-M;
    const rgb=h=>{h=h.replace("#","");return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16))};
    const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const {monto,extra,pcts,vals,tot}=ultimo;

    const ahora=new Date();
    const fecha=ahora.toLocaleDateString("es-CO",{day:"2-digit",month:"long",year:"numeric"});
    const hora=ahora.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});
    const p2=n=>String(n).padStart(2,"0");
    const nro=`${ahora.getFullYear()}${p2(ahora.getMonth()+1)}${p2(ahora.getDate())}-${p2(ahora.getHours())}${p2(ahora.getMinutes())}`;

    // Encabezado
    doc.setFillColor(14,21,19);
    doc.rect(0,0,W,40,"F");
    const logo=await cargarLogo();
    if(logo)doc.addImage(logo,"PNG",M,8,24,24);
    doc.setTextColor(255,255,255);
    doc.setFont("helvetica","bold");doc.setFontSize(16);
    doc.text("LIGNUM PRECISION TECH",logo?M+30:M,19);
    doc.setFont("helvetica","normal");doc.setFontSize(10);
    doc.setTextColor(157,179,170);
    doc.text("Extracto de distribución de ingresos",logo?M+30:M,26);

    // Datos del extracto
    let y=54;
    doc.setTextColor(120,130,126);doc.setFontSize(8);
    doc.text("EXTRACTO N°",M,y);
    doc.text("FECHA DE EMISIÓN",90,y);
    doc.text("INGRESO RECIBIDO",R,y,{align:"right"});
    doc.setTextColor(20,28,25);doc.setFont("helvetica","bold");doc.setFontSize(11);
    doc.text(nro,M,y+6);
    doc.text(`${fecha}, ${hora}`,90,y+6);
    doc.setFontSize(14);
    doc.text(fmt(monto),R,y+7,{align:"right"});

    doc.setDrawColor(210,218,214);doc.setLineWidth(.3);
    doc.line(M,y+13,R,y+13);

    // Tabla
    y=82;
    doc.setFillColor(238,242,240);
    doc.rect(M,y-6,R-M,10,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(60,70,66);
    doc.text("CONCEPTO",M+4,y);
    doc.text("REGLA",115,y,{align:"right"});
    doc.text("% REAL",143,y,{align:"right"});
    doc.text("VALOR",R-4,y,{align:"right"});

    y+=11;
    cats.forEach((c,i)=>{
      const [r,g,b]=rgb(css(c.c));
      doc.setFillColor(r,g,b);
      doc.circle(M+5,y-1.2,1.8,"F");
      doc.setFont("helvetica","normal");doc.setFontSize(11);doc.setTextColor(20,28,25);
      doc.text(c.k,M+10,y);
      doc.text(`${pcts[i]}%`,115,y,{align:"right"});
      doc.text(`${(tot?vals[i]/tot*100:0).toFixed(1).replace(".",",")}%`,143,y,{align:"right"});
      doc.setFont("helvetica","bold");
      doc.text(fmt(vals[i]),R-4,y,{align:"right"});
      doc.setDrawColor(228,234,231);
      doc.line(M,y+4.5,R,y+4.5);
      y+=11;
    });

    // Total
    doc.setFillColor(14,21,19);
    doc.rect(M,y-4,R-M,12,"F");
    doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(11);
    doc.text("TOTAL DISTRIBUIDO",M+4,y+3.5);
    doc.text(fmt(tot),R-4,y+3.5,{align:"right"});
    y+=24;

    // Horas extra
    if(extra>0){
      const horas=num($("horas").value), vh=num($("vh").value);
      doc.setTextColor(20,28,25);doc.setFont("helvetica","bold");doc.setFontSize(11);
      doc.text("Detalle de horas extra",M,y);
      doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(60,70,66);
      doc.text(`${horas} h x ${fmt(vh)} = ${fmt(extra)}`,M,y+7);
      doc.text("Este valor fue acreditado directamente a Ahorro.",M,y+13);
      y+=26;
    }

    // Pie
    doc.setDrawColor(210,218,214);
    doc.line(M,277,R,277);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(130,140,136);
    doc.text("Documento informativo generado automáticamente. No tiene validez contable ni tributaria.",W/2,283,{align:"center"});
    doc.text("© Lignum Precision Tech",W/2,288,{align:"center"});

    doc.save(`Extracto-Lignum-${nro}.pdf`);
  }finally{
    btn.textContent=txt;
  }
}
$("pdf").onclick=descargarPDF;

calc();