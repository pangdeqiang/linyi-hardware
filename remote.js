"use strict";
/* Online mode: products, hours, address and bookings come from the shop database.
   If the database is unreachable the built-in product list stays on screen. */
(function(){
  const C=window.SB;
  if(!C||!C.url||!C.key)return;
  const H={apikey:C.key,Authorization:"Bearer "+C.key};
  const CACHE="lyhw-cache-v1";
  const SHOP_KEYS=["hours","place","nameZh","nameEn","addrEn","mapUrl","mapQuery"];

  Object.assign(T.zh,{
    submit:"提交预约",submitting:"正在提交…",f_date:"取货/到店日期",
    book_note:"把要买的商品加进预约单,或直接在下面填写,再留下联系方式。点“提交预约”,我们就会收到。",
    ok:"预约已提交,我们会尽快联系你。",
    send_note:"这是你提交的预约信息。需要的话可以复制保存,或再用短信发给我们。",
    fail:"提交没有成功,可能是网络问题。请复制下面的预约信息,通过短信或微信发给我们。"
  });
  Object.assign(T.en,{
    submit:"Submit booking",submitting:"Submitting…",f_date:"Pickup / visit date",
    book_note:"Add items to your booking list, or type them in below, then leave your contact details. Tap “Submit booking” and we will receive it.",
    ok:"Booking sent. We will contact you soon.",
    send_note:"This is the booking you submitted. Copy it to keep a record, or send it to us by SMS as well.",
    fail:"Could not send the booking, maybe because of the network. Copy the message below and send it to us by SMS or WeChat."
  });
  $("go").dataset.i="submit";
  $("bnote").dataset.i="book_note";

  const pair=(a,b)=>a||b?[a||b,b||a]:null;
  const num=v=>{if(v==null||v==="")return null;const n=Number(v);return isNaN(n)?String(v):n};
  const toItem=r=>({c:r.cat,n:[r.name_zh,r.name_en||r.name_zh],s:pair(r.spec_zh,r.spec_en),u:pair(r.unit_zh,r.unit_en),p:num(r.price),k:"p"+r.id});

  function apply(d){
    if(d.cats&&d.cats.length){CATS.length=0;d.cats.forEach(c=>CATS.push(c))}
    if(d.rows&&d.rows.length){
      ITEMS.length=0;
      Object.keys(PHOTOS).forEach(k=>delete PHOTOS[k]);
      d.rows.forEach(r=>{
        const it=toItem(r);ITEMS.push(it);
        if(r.photos&&r.photos.length)PHOTOS[it.k]=r.photos;
        if(!CATS.some(c=>c.k===it.c))CATS.push({k:it.c,n:[it.c,it.c]});
      });
    }
    if(d.shop){
      SHOP_KEYS.forEach(k=>{if(typeof d.shop[k]==="string"&&d.shop[k].trim())CFG[k]=d.shop[k].trim()});
      if(d.shop.mapQuery)CFG.mapEmbed="https://maps.google.com/maps?q="+encodeURIComponent(CFG.mapQuery)+"&z=16&output=embed";
      $("v-addr").textContent=CFG.addrEn;
      $("v-link").href=CFG.mapUrl;
      if($("map").getAttribute("src")!==CFG.mapEmbed)$("map").src=CFG.mapEmbed;
    }
    applyLang();render();
  }

  try{const c=JSON.parse(localStorage.getItem(CACHE)||"null");if(c)apply(c)}catch(e){}

  (async function pull(){
    const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),9000);
    try{
      const [a,b]=await Promise.all([
        fetch(C.url+"/rest/v1/products?select=*&active=eq.true&order=sort.asc,id.asc&limit=1000",{headers:H,signal:ctl.signal}),
        fetch(C.url+"/rest/v1/settings?select=key,value",{headers:H,signal:ctl.signal})
      ]);
      if(!a.ok||!b.ok)return;
      const rows=await a.json(),st=await b.json(),m={};
      st.forEach(x=>{m[x.key]=x.value});
      const d={rows,cats:m.cats,shop:m.shop};
      try{localStorage.setItem(CACHE,JSON.stringify(d))}catch(e){}
      apply(d);
    }catch(e){}finally{clearTimeout(tm)}
  })();

  const go=$("go");
  go.onclick=async()=>{
    const d=collect();
    if(!d.name||!d.phone){$("er").textContent=t("err");return}
    $("er").textContent="";
    const m=bookingText(d);
    $("rt").value=m;
    $("sms").href="sms:"+CFG.smsTo+"?body="+encodeURIComponent(m);
    go.disabled=true;go.textContent=t("submitting");
    let ok=false;
    if($("hp").value){ok=true}
    else{
      try{
        const r=await fetch(C.url+"/rest/v1/bookings",{
          method:"POST",
          headers:Object.assign({"Content-Type":"application/json",Prefer:"return=minimal"},H),
          body:JSON.stringify({name:d.name,company:d.company||null,phone:d.phone,wechat:d.wechat||null,service:d.service,pickup_date:d.date||null,notes:d.notes||null,items:d.items})
        });
        ok=r.ok;
      }catch(e){}
    }
    go.disabled=false;go.textContent=t("submit");
    $("res").style.display="grid";
    const s=$("stat");s.textContent=t(ok?"ok":"fail");s.className="stat "+(ok?"good":"bad");
    if(ok){lines.length=0;lines.push(blank());saveLines();renderLines();updateCart()}
    $("rt").scrollIntoView({block:"center",behavior:"smooth"});
  };
  applyLang();
})();
