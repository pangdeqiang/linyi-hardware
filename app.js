"use strict";
/* Shop settings. Step 2 moves these into the admin page. */
const CFG={
  hours:"08:00 – 20:00",
  place:"Kajola, Ogun State",
  nameZh:"临沂五金供应商",
  nameEn:"Linyi Hardware Supplier",
  addrEn:"WH4Q+7R, Kajola 121107, Ogun State, Nigeria",
  mapUrl:"https://maps.app.goo.gl/GJhfdaFFiNZYHAkG7",
  mapEmbed:"https://maps.google.com/maps?q=WH4Q%2B7R%20Kajola%2C%20Ogun%20State%2C%20Nigeria&z=16&output=embed",
  smsTo:"08163394568"
};
const PHOTOS=window.PHOTOS||{},NB=String.fromCharCode(160);

const T={
zh:{
brand:"临沂五金建材",nav_products:"商品",nav_visit:"到店",nav_services:"服务",nav_book:"预约",nav_contact:"联系",
title:"临沂五金建材 | Kajola, Ogun State",
h1:"尼日利亚\n临沂五金建材",hsub:"{place} · 营业时间{sp}{hours}",
cta_products:"查看商品价格",cta_book:"预约",
h_products:"商品价格",price_note:"价格单位:人民币(¥)。点 + 把商品加入预约单。",
search:"搜索名称、型号或尺寸",all:"全部",
count_all:"共 {n} 件",count_some:"显示 {m} / {n} 件",ask:"询价",per:"/ {u}",
add:"加入预约单",added:"已加入预约单:{n}",view_photos:"查看图片",
empty:"没有找到「{q}」。换个词试试,或清除筛选。",clear:"清除筛选",
h_visit:"到店",visit_lead:"品种齐全,到店可以当面挑选。",shop:"店名",addr:"地址",hours:"营业时间",
open_map:"在 Google 地图中打开",map_title:"Google 地图:店铺位置",
h_services:"服务",
s1_t:"到店选购",s1_d:"品种齐全,到店可以当面挑选。不确定有没有货,先打电话问。",
s2_t:"电话、微信报价",s2_d:"把型号、尺寸和数量发给我们,我们回复报价。",
s3_t:"预约",s3_d:"选好商品和日期,把预约信息发给我们,方便提前备货。",
h_book:"预约",book_note:"把要买的商品加进预约单,或直接在下面填写,再留下联系方式。生成预约信息后复制,通过短信或微信发给我们。",
f_name:"姓名",f_company:"公司名称(选填)",f_phone:"电话",f_wechat:"你的微信号(选填)",f_service:"服务",f_date:"期望日期",
o0:"到店选购",o1:"咨询报价",o2:"其他",
f_items:"商品明细",ph_n:"商品名称",ph_s:"规格型号",ph_q:"数量",ph_u:"单位",rm:"删除这一行",add_line:"+ 添加一行",
f_notes:"备注(选填)",make:"生成预约信息",res_label:"预约信息",copy_msg:"复制预约信息",sms:"用短信发送",
send_note:"本页面不会发送任何内容。请复制后通过短信或微信发给我们。",
err:"请填写姓名和电话,方便我们联系你。",
cart:"预约单 {n} 项",cart_go:"去预约",
h_contact:"联系我们",phone:"电话",wechat:"微信号",copy:"复制",copied:"已复制",copy_fail:"请手动复制",
qr_cap:"微信扫一扫,添加好友",wc_add:"在微信中添加",foot:"© 临沂五金建材",
lb_close:"关闭",lb_prev:"上一张",lb_next:"下一张"
},
en:{
brand:"Linyi Hardware",nav_products:"Products",nav_visit:"Visit",nav_services:"Services",nav_book:"Book",nav_contact:"Contact",
title:"Linyi Hardware | Kajola, Ogun State",
h1:"Linyi Hardware & Building Materials, Nigeria",hsub:"{place} · Open{sp}{hours}",
cta_products:"See prices",cta_book:"Book",
h_products:"Products and prices",price_note:"Prices are in RMB (¥). Tap + to add an item to your booking list.",
search:"Search by name, model or size",all:"All",
count_all:"{n} items",count_some:"Showing {m} of {n} items",ask:"Ask for price",per:"/ {u}",
add:"Add to booking list",added:"Added to booking list: {n}",view_photos:"View photos",
empty:"No items match “{q}”. Try another word or clear the filter.",clear:"Clear filter",
h_visit:"Visit us",visit_lead:"Wide range in stock. Come in and choose in person.",shop:"Shop",addr:"Address",hours:"Opening hours",
open_map:"Open in Google Maps",map_title:"Google Maps: shop location",
h_services:"Services",
s1_t:"Shop in store",s1_d:"A wide range in stock, so you can choose in person. Not sure we have it? Call first.",
s2_t:"Quotes by phone or WeChat",s2_d:"Send us the model, size and quantity and we will reply with a price.",
s3_t:"Booking",s3_d:"Pick your items and a date, then send us the booking so we can have everything ready.",
h_book:"Book",book_note:"Add items to your booking list, or type them in below, then leave your contact details. Copy the booking message and send it to us by SMS or WeChat.",
f_name:"Name",f_company:"Company (optional)",f_phone:"Phone",f_wechat:"Your WeChat ID (optional)",f_service:"Service",f_date:"Preferred date",
o0:"Shop in store",o1:"Price enquiry",o2:"Other",
f_items:"Items",ph_n:"Item",ph_s:"Model / size",ph_q:"Qty",ph_u:"Unit",rm:"Remove this line",add_line:"+ Add a line",
f_notes:"Notes (optional)",make:"Create booking message",res_label:"Booking message",copy_msg:"Copy message",sms:"Open in SMS app",
send_note:"This page does not send anything. Copy the message and send it to us by SMS or WeChat.",
err:"Please enter your name and phone so we can reach you.",
cart:"Booking list: {n}",cart_go:"Review",
h_contact:"Contact us",phone:"Phone",wechat:"WeChat ID",copy:"Copy",copied:"Copied",copy_fail:"Copy manually",
qr_cap:"Scan with WeChat to add us",wc_add:"Add on WeChat",foot:"© Linyi Hardware & Building Materials",
lb_close:"Close",lb_prev:"Previous",lb_next:"Next"
}};

const $=id=>document.getElementById(id);
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
let lang="zh",cat="all";
try{const s=localStorage.getItem("lang");if(s==="zh"||s==="en")lang=s;else if(!/^zh/i.test(navigator.language||""))lang="en"}
catch(e){if(!/^zh/i.test(navigator.language||""))lang="en"}
const L=()=>lang==="zh"?0:1;
const t=k=>T[lang][k];
const fill=(s,o)=>s.replace(/\{(\w+)\}/g,(m,k)=>o[k]!=null?o[k]:m);
const priceText=p=>typeof p==="number"?"¥"+p:String(p).split("/").map(x=>"¥"+x.trim()).join(" / ");
const hasPhotos=()=>Object.values(PHOTOS).some(a=>a&&a.length);

/* ---------- booking list state ---------- */
const blank=()=>({n:"",s:"",q:1,u:"",b:null});
let lines=[blank()];
try{const s=JSON.parse(sessionStorage.getItem("lines")||"null");if(Array.isArray(s)&&s.length)lines=s}catch(e){}
const saveLines=()=>{try{sessionStorage.setItem("lines",JSON.stringify(lines))}catch(e){}};
const isBlank=l=>!String(l.n||"").trim()&&!String(l.s||"").trim();
const filled=()=>lines.filter(l=>!isBlank(l));

function addItem(it){
  const same=lines.find(l=>l.k===it.k);
  if(same){same.q=(Number(same.q)||0)+1}
  else{
    const b={n:it.n,s:it.s||["",""],u:it.u||["",""]};
    const ln={k:it.k,n:b.n[L()],s:b.s[L()],q:1,u:b.u[L()],b};
    if(lines.length===1&&isBlank(lines[0]))lines[0]=ln;else lines.push(ln);
  }
  saveLines();renderLines();updateCart();
  $("live").textContent=fill(t("added"),{n:it.n[L()]+(it.s&&it.s[L()]?" "+it.s[L()]:"")});
}

/* ---------- products ---------- */
function matches(it,q){
  if(!q)return true;
  return (it.n[0]+" "+it.n[1]+" "+(it.s?it.s[0]+" "+it.s[1]:"")).toLowerCase().includes(q);
}
function mediaCell(it){
  const m=el("div","md"),ph=PHOTOS[it.k]||[];
  if(ph.length){
    const b=el("button","stack");b.type="button";
    b.setAttribute("aria-label",t("view_photos")+": "+it.n[L()]+" ("+ph.length+")");
    ph.slice(0,3).forEach(src=>{const im=new Image();im.src=src;im.alt="";im.loading="lazy";im.decoding="async";b.append(im)});
    if(ph.length>1)b.append(el("span","cnt",String(ph.length)));
    b.onclick=()=>openLb(it,0);
    m.append(b);
  }
  return m;
}
function render(){
  const q=$("q").value.trim().toLowerCase();
  const found=ITEMS.filter(it=>matches(it,q));
  const counts={};found.forEach(it=>counts[it.c]=(counts[it.c]||0)+1);
  const chips=$("chips");chips.replaceChildren();
  const mk=(key,label,n)=>{
    const b=el("button","chip");b.type="button";b.setAttribute("aria-pressed",String(cat===key));
    b.append(label,el("span","n",String(n)));
    b.onclick=()=>{cat=key;render();b.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"})};
    chips.append(b);
  };
  mk("all",t("all"),found.length);
  CATS.forEach(c=>{if(counts[c.k])mk(c.k,c.n[L()],counts[c.k])});
  if(cat!=="all"&&!counts[cat])cat="all";
  const shown=cat==="all"?found:found.filter(it=>it.c===cat);
  $("count").textContent=shown.length===ITEMS.length?fill(t("count_all"),{n:ITEMS.length}):fill(t("count_some"),{m:shown.length,n:ITEMS.length});
  const out=$("out");out.replaceChildren();
  const md=hasPhotos();out.className=md?"hasmd":"";
  if(!shown.length){
    const d=el("div","empty",fill(t("empty"),{q:$("q").value.trim()}));
    const b=el("button","pill ghost sm",t("clear"));b.type="button";
    b.onclick=()=>{$("q").value="";cat="all";render()};
    d.append(b);out.append(d);return;
  }
  CATS.forEach(c=>{
    const rows=shown.filter(it=>it.c===c.k);if(!rows.length)return;
    const g=el("div","grp");
    const h=el("h3",null,c.n[L()]);h.append(el("span",null,String(rows.length)));
    g.append(h);
    const list=el("div","list");
    rows.forEach(it=>{
      const r=el("div","row");
      if(md)r.append(mediaCell(it));
      const tx=el("div","tx");
      tx.append(el("div","nm",it.n[L()]),el("div","sp",it.s?it.s[L()]:""));
      r.append(tx);
      const pr=el("div","pr");
      if(it.p===null)pr.append(el("span","price ask",t("ask")));
      else{
        const p=el("span","price",priceText(it.p));
        if(it.u)p.append(el("small",null,fill(t("per"),{u:it.u[L()]})));
        pr.append(p);
      }
      r.append(pr);
      const a=el("button","add","+");a.type="button";
      a.setAttribute("aria-label",t("add")+": "+it.n[L()]+(it.s&&it.s[L()]?" "+it.s[L()]:""));
      a.onclick=()=>{
        addItem(it);
        a.textContent="✓";a.classList.add("ok");
        setTimeout(()=>{a.textContent="+";a.classList.remove("ok")},900);
      };
      r.append(a);
      list.append(r);
    });
    g.append(list);out.append(g);
  });
}

/* ---------- booking form ---------- */
function fieldText(l,f){return l.b&&l.b[f]?l.b[f][L()]:l[f]}
function renderLines(){
  const box=$("lines");box.replaceChildren();
  lines.forEach((l,i)=>{
    ["n","s","u"].forEach(f=>{if(l.b&&l.b[f])l[f]=l.b[f][L()]});
    const row=el("div","ln");
    const mk=(f,cls,ph,type)=>{
      const inp=document.createElement("input");
      inp.className=cls;inp.type=type||"text";inp.value=l[f]==null?"":l[f];
      inp.placeholder=t(ph);inp.setAttribute("aria-label",t(ph));
      inp.autocomplete="off";
      if(f==="q"){inp.inputMode="numeric";inp.min="1"}
      inp.oninput=()=>{
        if(f==="q")l.q=inp.value===""?"":Number(inp.value);
        else{l[f]=inp.value;if(l.b)delete l.b[f];if(f!=="u")delete l.k}
        saveLines();updateCart();
      };
      return inp;
    };
    row.append(mk("n","in-n","ph_n"),mk("s","in-s","ph_s"),mk("q","in-q","ph_q","number"),mk("u","in-u","ph_u"));
    const x=el("button","x","×");x.type="button";
    x.setAttribute("aria-label",t("rm"));
    x.onclick=()=>{
      lines.splice(i,1);if(!lines.length)lines.push(blank());
      saveLines();renderLines();updateCart();
    };
    row.append(x);box.append(row);
  });
}
function collect(){
  const sv=Number($("bs").value);
  const both=(l,f)=>{
    if(l.b&&l.b[f]){const [z,e]=l.b[f];return !z||!e||z===e?(z||e):z+" / "+e}
    return String(l[f]||"").trim();
  };
  return{
    name:$("bn").value.trim(),company:$("bc").value.trim(),phone:$("bp").value.trim(),wechat:$("bw").value.trim(),
    service:T.zh["o"+sv]+" / "+T.en["o"+sv],date:$("bd").value,notes:$("bt").value.trim(),
    items:filled().map(l=>({name:both(l,"n"),spec:both(l,"s"),qty:Number(l.q)||1,unit:both(l,"u")}))
  };
}
function bookingText(d){
  const out=["【预约 Booking】"+CFG.nameZh+" "+CFG.nameEn,
    "姓名 Name: "+d.name,"公司 Company: "+(d.company||"-"),"电话 Phone: "+d.phone,"微信 WeChat: "+(d.wechat||"-"),
    "服务 Service: "+d.service,"日期 Date: "+(d.date||"不限 Any")];
  if(d.items.length){
    out.push("商品明细 Items:");
    d.items.forEach((it,i)=>out.push((i+1)+". "+it.name+(it.spec?" | "+it.spec:"")+" | ×"+it.qty+(it.unit?" "+it.unit:"")));
  }
  out.push("备注 Notes: "+(d.notes||"-"));
  return out.join("\n");
}
async function copyText(text,btn,after){
  const reset=()=>{btn.textContent=btn.dataset.i?t(btn.dataset.i):btn.textContent};
  const ok=()=>{if(after)after(true);btn.textContent=t("copied");setTimeout(reset,1600)};
  try{await navigator.clipboard.writeText(text);ok();return}catch(e){}
  try{
    const ta=document.createElement("textarea");ta.value=text;ta.setAttribute("readonly","");
    ta.style.position="fixed";ta.style.opacity="0";document.body.append(ta);ta.select();
    const done=document.execCommand("copy");ta.remove();if(done){ok();return}
  }catch(e){}
  if(after)after(false);
  btn.textContent=t("copy_fail");setTimeout(reset,2200);
}

/* ---------- floating booking pill ---------- */
let bookVisible=false;
function updateCart(){
  const n=filled().length;
  $("cartn").textContent=fill(t("cart"),{n});
  const on=n>0&&!bookVisible;
  const c=$("cart");
  if(on&&!c.classList.contains("on")){c.classList.add("on");c.removeAttribute("aria-hidden");c.inert=false}
  if(!on&&c.classList.contains("on")){c.classList.remove("on");c.setAttribute("aria-hidden","true");c.inert=true}
}
function bump(){const c=$("cart");if(!c.classList.contains("on"))return;c.classList.remove("bump");void c.offsetWidth;c.classList.add("bump")}

/* ---------- photo lightbox ---------- */
let lb={it:null,i:0},lastFocus=null;
function showLb(){
  const ph=PHOTOS[lb.it.k]||[],n=ph.length;if(!n)return;
  lb.i=(lb.i+n)%n;
  $("lbi").src=ph[lb.i];$("lbi").alt=lb.it.n[L()];
  $("lbc").textContent=lb.it.n[L()]+(lb.it.s&&lb.it.s[L()]?" · "+lb.it.s[L()]:"")+"  ("+(lb.i+1)+"/"+n+")";
  $("lbp").hidden=$("lbn").hidden=n<2;
}
function openLb(it,i){lb={it,i};lastFocus=document.activeElement;showLb();$("lb").hidden=false;document.body.style.overflow="hidden";$("lbx").focus()}
function closeLb(){$("lb").hidden=true;document.body.style.overflow="";if(lastFocus&&lastFocus.focus)lastFocus.focus()}
document.addEventListener("keydown",e=>{
  if($("lb").hidden)return;
  if(e.key==="Escape")closeLb();
  else if(e.key==="ArrowLeft"){lb.i--;showLb()}
  else if(e.key==="ArrowRight"){lb.i++;showLb()}
  else if(e.key==="Tab"){
    const f=[...$("lb").querySelectorAll("button")].filter(b=>!b.hidden);
    if(!f.length)return;
    const a=f.indexOf(document.activeElement);
    if(e.shiftKey&&a<=0){e.preventDefault();f[f.length-1].focus()}
    else if(!e.shiftKey&&a===f.length-1){e.preventDefault();f[0].focus()}
  }
});
$("lbx").onclick=closeLb;$("lbp").onclick=()=>{lb.i--;showLb()};$("lbn").onclick=()=>{lb.i++;showLb()};
$("lb").addEventListener("click",e=>{if(e.target===$("lb"))closeLb()});

/* ---------- language ---------- */
function applyLang(){
  document.documentElement.lang=lang==="zh"?"zh-CN":"en";
  document.title=t("title");
  document.querySelectorAll("[data-i]").forEach(n=>{n.textContent=t(n.dataset.i)});
  document.querySelectorAll("[data-ip]").forEach(n=>{n.placeholder=t(n.dataset.ip)});
  $("l-zh").setAttribute("aria-pressed",String(lang==="zh"));
  $("l-en").setAttribute("aria-pressed",String(lang==="en"));
  $("q").setAttribute("aria-label",t("search"));
  $("lbx").setAttribute("aria-label",t("lb_close"));$("lbp").setAttribute("aria-label",t("lb_prev"));$("lbn").setAttribute("aria-label",t("lb_next"));
  $("hsub").textContent=fill(t("hsub"),{place:CFG.place,hours:CFG.hours.split(" ").join(NB),sp:NB});
  $("v-shop").textContent=lang==="zh"?CFG.nameZh:CFG.nameEn;
  $("v-shop2").textContent=lang==="zh"?CFG.nameEn:CFG.nameZh;
  $("v-hours").textContent=CFG.hours;
  $("map").title=t("map_title");
  renderLines();updateCart();
}

/* ---------- init ---------- */
$("v-addr").textContent=CFG.addrEn;
$("v-link").href=CFG.mapUrl;
$("map").src=CFG.mapEmbed;
$("sms").href="sms:"+CFG.smsTo;
try{$("bd").min=new Date().toLocaleDateString("en-CA")}catch(e){}
$("l-zh").onclick=()=>{lang="zh";try{localStorage.setItem("lang","zh")}catch(e){}applyLang();render()};
$("l-en").onclick=()=>{lang="en";try{localStorage.setItem("lang","en")}catch(e){}applyLang();render()};
$("q").addEventListener("input",render);
$("addline").onclick=()=>{
  lines.push(blank());saveLines();renderLines();
  const last=$("lines").lastElementChild;if(last)last.querySelector("input").focus();
};
document.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",()=>copyText(b.dataset.copy,b)));
$("go").onclick=()=>{
  const d=collect();
  if(!d.name||!d.phone){$("er").textContent=t("err");return}
  $("er").textContent="";
  const m=bookingText(d);
  $("rt").value=m;$("res").style.display="grid";$("cs").textContent="";
  $("sms").href="sms:"+CFG.smsTo+"?body="+encodeURIComponent(m);
  $("rt").scrollIntoView({block:"center",behavior:"smooth"});
};
$("copyres").onclick=()=>copyText($("rt").value,$("copyres"),ok=>{if(!ok)$("rt").select()});
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest(".add"))bump()});

if("IntersectionObserver" in window){
  new IntersectionObserver(es=>{bookVisible=es[0].isIntersecting;updateCart()},{rootMargin:"0px 0px -15% 0px"}).observe($("book"));
}
$("cart").setAttribute("aria-hidden","true");$("cart").inert=true;
applyLang();render();
