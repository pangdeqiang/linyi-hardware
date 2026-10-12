"use strict";
/* Staff back office: bookings, products, shop settings. Chinese only. */
const $app=document.getElementById("app");
const SBC=window.SB;
function h(tag,props,...kids){
  const e=document.createElement(tag);
  for(const k in props||{}){
    const v=props[k];if(v==null||v===false)continue;
    if(k==="class")e.className=v;
    else if(k.startsWith("on"))e.addEventListener(k.slice(2),v);
    else if(k==="value")e.value=v;
    else if(k==="checked")e.checked=true;
    else e.setAttribute(k,v===true?"":v);
  }
  for(const c of kids.flat(Infinity)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}
  return e;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function toast(t){const e=h("div",{class:"toast",role:"status"},t);document.body.append(e);setTimeout(()=>e.remove(),2200)}
function setMsg(el,t,ok){el.textContent=t||"";el.className="msg "+(t?(ok?"good":"bad"):"")}

if(!SBC||!SBC.url||!SBC.key||typeof supabase==="undefined"){
  $app.append(h("div",{class:"login"},h("h1",null,"后台还没有接通"),h("p",{class:"mut"},"网站还没有连接数据库,或者网络无法打开必要的组件。请稍后刷新页面再试。")));
  throw new Error("not configured");
}
const sb=supabase.createClient(SBC.url,SBC.key,{auth:{persistSession:true,autoRefreshToken:true}});

const STATUS={new:"新预约",confirmed:"已确认",done:"已完成",cancelled:"已取消"};
let user=null,tab="bookings",bookings=[],products=[],cats=[],lastSeen=0,filter="open",sortBy="created",timer=null;

/* ---------- formatting ---------- */
function fmtTime(iso){
  try{return new Date(iso).toLocaleString("zh-CN",{timeZone:"Africa/Lagos",hour12:false,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}catch(e){return iso}
}
function lagosToday(){return new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Lagos"})}
function fmtDay(d){
  if(!d)return "未填写";
  try{const w=new Date(d+"T12:00:00").toLocaleDateString("zh-CN",{weekday:"short"});return d+" "+w}catch(e){return d}
}
async function copy(text){
  try{await navigator.clipboard.writeText(text);toast("已复制")}
  catch(e){const ta=h("textarea",{style:"position:fixed;opacity:0"});ta.value=text;document.body.append(ta);ta.select();try{document.execCommand("copy");toast("已复制")}catch(_){toast("请手动复制")}ta.remove()}
}
const catName=k=>{const c=cats.find(x=>x.k===k);return c?c.n[0]:k};

/* ---------- login ---------- */
function showLogin(msg){
  $app.replaceChildren();
  const em=h("input",{type:"email",autocomplete:"username",placeholder:"邮箱",required:true});
  const pw=h("input",{type:"password",autocomplete:"current-password",placeholder:"密码",required:true});
  const out=h("p",{class:"msg bad",role:"alert"},msg||"");
  const btn=h("button",{class:"pill",type:"submit"},"登录");
  const f=h("form",{class:"login",onsubmit:async ev=>{
    ev.preventDefault();btn.disabled=true;out.textContent="";
    const {error}=await sb.auth.signInWithPassword({email:em.value.trim(),password:pw.value});
    btn.disabled=false;
    if(error){out.textContent="登录失败:邮箱或密码不对。";return}
    start();
  }},h("h1",null,"临沂五金 后台"),h("p",{class:"mut"},"仅限店里的员工登录。"),em,pw,out,btn);
  $app.append(f);
}

async function start(){
  const {data}=await sb.auth.getSession();
  if(!data.session){showLogin();return}
  user=data.session.user;
  const {data:rows,error}=await sb.from("staff").select("email").ilike("email",user.email);
  if(error||!rows||!rows.length){await sb.auth.signOut();showLogin("这个账号没有后台权限。请联系店主把你的邮箱加入员工名单。");return}
  await loadCats();
  shell();
  await showTab(tab);
  clearInterval(timer);
  timer=setInterval(()=>{if(document.visibilityState==="visible"&&tab==="bookings")refreshBookings(true)},30000);
}

function shell(){
  $app.replaceChildren();
  const logout=h("button",{class:"btn",onclick:async()=>{await sb.auth.signOut();clearInterval(timer);showLogin()}},"退出");
  $app.append(
    h("header",{class:"top"},h("div",{class:"wrap"},h("h1",null,"临沂五金 后台"),h("span",{class:"who"},user.email),h("a",{class:"btn",href:"index.html",target:"_blank",rel:"noopener"},"看网站"),logout)),
    h("div",{class:"wrap"},
      h("div",{class:"tabs",role:"tablist",id:"tabs"},
        ["bookings","products","settings"].map(k=>h("button",{role:"tab","data-t":k,onclick:()=>showTab(k)},{bookings:"预约",products:"商品",settings:"设置"}[k],k==="bookings"?h("span",{class:"badge",id:"nb",hidden:true}):null))),
      h("main",{id:"main"})));
}
async function showTab(k){
  tab=k;
  document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.t===k)));
  const m=document.getElementById("main");m.replaceChildren(h("p",{class:"empty"},"正在加载…"));
  if(k==="bookings")await refreshBookings();
  else if(k==="products")await loadProducts();
  else await renderSettings();
}

/* ---------- bookings ---------- */
async function refreshBookings(quiet){
  const {data,error}=await sb.from("bookings").select("*").order("created_at",{ascending:false}).limit(500);
  if(error){if(!quiet)document.getElementById("main").replaceChildren(h("p",{class:"empty"},"加载失败,请刷新页面。"));return}
  const maxId=data.reduce((m,b)=>Math.max(m,b.id),0);
  if(quiet&&lastSeen&&maxId>lastSeen){toast("有新预约");document.title="(新) 临沂五金 后台"}
  lastSeen=Math.max(lastSeen,maxId);
  bookings=data;
  const nb=document.getElementById("nb");
  if(nb){const n=bookings.filter(b=>b.status==="new").length;nb.textContent=n;nb.hidden=!n}
  if(tab==="bookings")renderBookings();
}
function sortedBookings(){
  let list=bookings.filter(b=>filter==="all"?true:filter==="open"?(b.status==="new"||b.status==="confirmed"):b.status===filter);
  if(sortBy==="pickup"){
    list=list.slice().sort((a,b)=>{
      if(!a.pickup_date&&!b.pickup_date)return b.created_at.localeCompare(a.created_at);
      if(!a.pickup_date)return 1;if(!b.pickup_date)return -1;
      return a.pickup_date.localeCompare(b.pickup_date)||a.created_at.localeCompare(b.created_at);
    });
  }
  return list;
}
function renderBookings(){
  const m=document.getElementById("main");m.replaceChildren();
  document.title="临沂五金 后台";
  const chips=[["open","待处理"],["new","新预约"],["confirmed","已确认"],["done","已完成"],["cancelled","已取消"],["all","全部"]];
  m.append(h("div",{class:"bar"},
    h("div",{class:"chips grow"},chips.map(([k,t])=>h("button",{class:"chip","aria-pressed":String(filter===k),onclick:()=>{filter=k;renderBookings()}},t))),
  ),h("div",{class:"bar"},
    h("select",{"aria-label":"排序",onchange:e=>{sortBy=e.target.value;renderBookings()}},
      h("option",{value:"created",selected:sortBy==="created"},"按提交时间(最新在前)"),
      h("option",{value:"pickup",selected:sortBy==="pickup"},"按取货日期(最近在前)")),
    h("button",{class:"btn",onclick:()=>refreshBookings()},"刷新"),
    h("button",{class:"btn",onclick:exportCsv},"导出表格")));
  const list=sortedBookings();
  if(!list.length){m.append(h("p",{class:"empty"},"这里还没有预约。"));return}
  list.forEach(b=>m.append(card(b)));
}
function pickupNode(b){
  const t=lagosToday(),d=b.pickup_date;
  const soon=d&&b.status!=="done"&&b.status!=="cancelled"&&d<=t;
  return h("b",{class:soon?"soon":""},fmtDay(d),d&&d===t?"(今天)":d&&d<t&&soon?"(已过期)":"");
}
function card(b){
  const items=Array.isArray(b.items)?b.items:[];
  const note=h("input",{type:"text",placeholder:"员工备注(只有员工看得到)",value:b.staff_note||"",maxlength:"500",
    onchange:async e=>{const {error}=await sb.from("bookings").update({staff_note:e.target.value||null}).eq("id",b.id);if(error)toast("保存失败");else{b.staff_note=e.target.value;toast("已保存")}}});
  const act=(label,st,cls)=>h("button",{class:"btn "+(cls||""),onclick:()=>setStatus(b,st)},label);
  const actions=b.status==="new"?[act("确认","confirmed","dark"),act("取消","cancelled")]
    :b.status==="confirmed"?[act("已取货 / 完成","done","dark"),act("取消","cancelled")]
    :[act("恢复为新预约","new")];
  return h("article",{class:"card b-"+b.status},
    h("div",{class:"bh"},h("div",null,h("strong",null,b.name),b.company?h("span",{class:"mut"}," · "+b.company):null),h("span",{class:"tag t-"+b.status},STATUS[b.status]||b.status)),
    h("div",{class:"mut small"},"提交于 "+fmtTime(b.created_at)+(b.service?" · "+b.service:"")),
    h("div",{class:"kv"},
      h("div",null,h("span",{class:"k"},"取货/到店日期"),pickupNode(b)),
      h("div",null,h("span",{class:"k"},"电话"),h("a",{href:"tel:"+b.phone},b.phone)," ",h("button",{class:"btn",onclick:()=>copy(b.phone)},"复制")),
      b.wechat?h("div",null,h("span",{class:"k"},"微信号"),h("b",null,b.wechat)," ",h("button",{class:"btn",onclick:()=>copy(b.wechat)},"复制")):null),
    items.length?h("ol",{class:"items"},items.map(it=>h("li",null,it.name,it.spec?" · "+it.spec:"",h("b",null," × "+it.qty+(it.unit?" "+it.unit:"")))))
      :h("p",{class:"mut"},"没有填写商品明细"),
    b.notes?h("p",{class:"note"},"顾客备注:"+b.notes):null,
    h("div",{class:"acts2"},actions,note));
}
async function setStatus(b,st){
  const {error}=await sb.from("bookings").update({status:st}).eq("id",b.id);
  if(error){toast("保存失败,请重试");return}
  b.status=st;toast("已更新");await refreshBookings(true);
}
function exportCsv(){
  const rows=[["提交时间","状态","姓名","公司","电话","微信","服务","取货/到店日期","商品明细","顾客备注","员工备注"]];
  sortedBookings().forEach(b=>rows.push([fmtTime(b.created_at),STATUS[b.status]||b.status,b.name,b.company||"",b.phone,b.wechat||"",b.service||"",b.pickup_date||"",
    (b.items||[]).map(it=>it.name+(it.spec?" "+it.spec:"")+" x"+it.qty+(it.unit?it.unit:"")).join("; "),b.notes||"",b.staff_note||""]));
  const csv=String.fromCharCode(65279)+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const a=h("a",{href:URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),download:"预约-"+lagosToday()+".csv"});
  document.body.append(a);a.click();a.remove();
}

/* ---------- products ---------- */
async function loadCats(){
  const {data}=await sb.from("settings").select("value").eq("key","cats").maybeSingle();
  cats=data&&Array.isArray(data.value)&&data.value.length?data.value:CATS.map(c=>({k:c.k,n:c.n.slice()}));
}
async function loadProducts(){
  const {data,error}=await sb.from("products").select("*").order("sort",{ascending:true}).order("id",{ascending:true}).limit(1000);
  if(error){document.getElementById("main").replaceChildren(h("p",{class:"empty"},"加载失败,请刷新页面。"));return}
  products=data;renderProducts();
}
let pq="",pcat="";
function renderProducts(){
  const m=document.getElementById("main");m.replaceChildren();
  if(!products.length){
    m.append(h("div",{class:"sect"},h("h2",null,"导入现有商品"),
      h("p",{class:"mut"},"数据库里还没有商品。点下面的按钮,把网站原来的 "+ITEMS.length+" 件商品一次性导入,之后就可以在这里改价格、加图片、新增商品。"),
      h("div",null,h("button",{class:"btn pri",id:"imp",onclick:importItems},"导入 "+ITEMS.length+" 件商品")),h("p",{class:"msg",id:"impm"})));
    return;
  }
  const q=h("input",{class:"grow",type:"search",placeholder:"搜索商品名称、规格",value:pq,oninput:e=>{pq=e.target.value;drawList()}});
  const sel=h("select",{"aria-label":"分类",onchange:e=>{pcat=e.target.value;drawList()}},h("option",{value:""},"全部分类"),cats.map(c=>h("option",{value:c.k,selected:pcat===c.k},c.n[0])));
  m.append(h("div",{class:"bar"},q,sel,h("button",{class:"btn pri",onclick:()=>editProduct(null)},"+ 新增商品")),h("p",{class:"mut small",id:"pcount"}),h("div",{class:"plist",id:"plist"}));
  drawList();
}
function drawList(){
  const box=document.getElementById("plist");if(!box)return;
  const q=pq.trim().toLowerCase();
  const list=products.filter(p=>(!pcat||p.cat===pcat)&&(!q||[p.name_zh,p.name_en,p.spec_zh,p.spec_en].join(" ").toLowerCase().includes(q)));
  document.getElementById("pcount").textContent="共 "+list.length+" 件"+(list.length>200?"(只显示前 200 件,请用搜索缩小范围)":"");
  box.replaceChildren();
  if(!list.length){box.append(h("p",{class:"empty"},"没有找到。"));return}
  list.slice(0,200).forEach(p=>{
    const img=p.photos&&p.photos.length?h("img",{src:p.photos[0],alt:"",loading:"lazy"}):h("div",{class:"ph"});
    box.append(h("button",{class:"prow"+(p.active?"":" off"),type:"button",onclick:()=>editProduct(p)},img,
      h("div",null,h("div",{class:"nm"},p.name_zh),h("div",{class:"mut small"},[catName(p.cat),p.spec_zh,p.active?"":"已下架"].filter(Boolean).join(" · "))),
      h("div",{class:"pr"},p.price?"¥"+p.price+(p.unit_zh?" /"+p.unit_zh:""):"询价")));
  });
}
async function importItems(){
  const btn=document.getElementById("imp"),msg=document.getElementById("impm");
  btn.disabled=true;setMsg(msg,"正在导入…",true);
  const rows=ITEMS.map((it,i)=>({cat:it.c,name_zh:it.n[0],name_en:it.n[1],spec_zh:it.s?it.s[0]:null,spec_en:it.s?it.s[1]:null,unit_zh:it.u?it.u[0]:null,unit_en:it.u?it.u[1]:null,price:it.p==null?null:String(it.p),sort:(i+1)*10}));
  for(let i=0;i<rows.length;i+=100){
    const {error}=await sb.from("products").insert(rows.slice(i,i+100));
    if(error){setMsg(msg,"导入失败:"+error.message,false);btn.disabled=false;return}
  }
  const have=await sb.from("settings").select("key").eq("key","cats").maybeSingle();
  if(!have.data)await sb.from("settings").insert({key:"cats",value:CATS.map(c=>({k:c.k,n:c.n}))});
  await loadCats();await loadProducts();toast("已导入");
}

function editProduct(p){
  const isNew=!p;
  let cur=p?Object.assign({},p):{cat:cats[0]?cats[0].k:"misc",name_zh:"",name_en:"",spec_zh:"",spec_en:"",unit_zh:"",unit_en:"",price:"",active:true,sort:(products.reduce((m,x)=>Math.max(m,x.sort),0)+10),photos:[]};
  const dlg=h("dialog");
  const msg=h("p",{class:"msg",role:"status"});
  const f={};
  const fld=(label,key,props)=>{const i=h("input",Object.assign({type:"text",value:cur[key]==null?"":cur[key]},props||{}));f[key]=i;return h("label",null,label,i)};
  const catSel=h("select",null,cats.map(c=>h("option",{value:c.k,selected:cur.cat===c.k},c.n[0])));
  const act=h("input",{type:"checkbox",checked:cur.active});
  const photoBox=h("div",{class:"photos"});
  const photoNote=h("p",{class:"mut small"});
  const fileIn=h("input",{type:"file",accept:"image/*",multiple:true,hidden:true,onchange:async e=>{await addPhotos([...e.target.files]);e.target.value=""}});
  const addBtn=h("button",{class:"btn pri",type:"button",onclick:()=>fileIn.click()},"+ 从相册选择图片");

  function drawPhotos(){
    photoBox.replaceChildren();
    cur.photos.forEach((u,i)=>photoBox.append(h("div",{class:"pic"},
      h("img",{src:u,alt:""}),i===0?h("span",{class:"cover"},"封面"):null,
      i>0?h("button",{class:"btn",type:"button",onclick:()=>{cur.photos.splice(i,1);cur.photos.unshift(u);savePhotos()}},"设为封面"):null,
      h("button",{class:"btn bad",type:"button",onclick:()=>removePhoto(u)},"删除"))));
    addBtn.hidden=!cur.id;photoNote.textContent=cur.id?(cur.photos.length?"第一张是封面,会显示在商品旁边。":"还没有图片。"):"先点“保存”,保存后就可以添加图片。";
  }
  async function savePhotos(){
    const {error}=await sb.from("products").update({photos:cur.photos}).eq("id",cur.id);
    if(error){setMsg(msg,"保存图片失败:"+error.message,false);return false}
    const row=products.find(x=>x.id===cur.id);if(row)row.photos=cur.photos.slice();
    drawPhotos();return true;
  }
  async function removePhoto(u){
    cur.photos=cur.photos.filter(x=>x!==u);
    if(await savePhotos()){
      const path=u.split("/storage/v1/object/public/photos/")[1];
      if(path)await sb.storage.from("photos").remove([decodeURIComponent(path)]);
    }
  }
  async function addPhotos(files){
    if(!files.length||!cur.id)return;
    let n=0;
    for(const file of files){
      setMsg(msg,"正在上传第 "+(++n)+" / "+files.length+" 张…",true);
      try{
        const blob=await shrink(file);
        const path=cur.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+".jpg";
        const up=await sb.storage.from("photos").upload(path,blob,{contentType:"image/jpeg",cacheControl:"31536000"});
        if(up.error)throw up.error;
        cur.photos.push(sb.storage.from("photos").getPublicUrl(path).data.publicUrl);
      }catch(err){setMsg(msg,"上传失败:"+(err.message||err),false);return}
    }
    if(await savePhotos())setMsg(msg,"图片已保存。",true);
  }
  async function save(){
    const name=f.name_zh.value.trim();
    if(!name){setMsg(msg,"请填写中文名称。",false);return}
    const price=f.price.value.trim();
    if(price&&!/^[0-9]+(\.[0-9]+)?(\s*\/\s*[0-9]+(\.[0-9]+)?)*$/.test(price)){setMsg(msg,"价格只能写数字,例如 12 或 12.5 或 12/15。留空表示询价。",false);return}
    const row={cat:catSel.value,name_zh:name,name_en:f.name_en.value.trim()||null,spec_zh:f.spec_zh.value.trim()||null,spec_en:f.spec_en.value.trim()||null,
      unit_zh:f.unit_zh.value.trim()||null,unit_en:f.unit_en.value.trim()||null,price:price||null,active:act.checked,sort:Number(f.sort.value)||0};
    saveBtn.disabled=true;
    let res;
    if(cur.id)res=await sb.from("products").update(row).eq("id",cur.id).select().single();
    else res=await sb.from("products").insert(row).select().single();
    saveBtn.disabled=false;
    if(res.error){setMsg(msg,"保存失败:"+res.error.message,false);return}
    const wasNew=!cur.id;
    cur=res.data;
    if(wasNew)products.push(cur);else products=products.map(x=>x.id===cur.id?cur:x);
    drawList();drawPhotos();
    setMsg(msg,wasNew?"已保存。现在可以添加图片了。":"已保存。",true);
    if(!wasNew)dlg.close();
  }
  async function del(){
    if(!cur.id||!confirm("确定要删除“"+cur.name_zh+"”吗?删除后无法恢复。只是暂时不卖的话,请取消勾选“上架”。"))return;
    const {error}=await sb.from("products").delete().eq("id",cur.id);
    if(error){setMsg(msg,"删除失败:"+error.message,false);return}
    if(cur.photos.length){const paths=cur.photos.map(u=>decodeURIComponent((u.split("/storage/v1/object/public/photos/")[1]||""))).filter(Boolean);if(paths.length)await sb.storage.from("photos").remove(paths)}
    products=products.filter(x=>x.id!==cur.id);drawList();dlg.close();toast("已删除");
  }
  const saveBtn=h("button",{class:"btn pri",type:"button",onclick:save},"保存");
  dlg.append(h("div",{class:"fm"},
    h("h2",null,isNew?"新增商品":"编辑商品"),
    h("label",null,"分类",catSel),
    fld("名称(中文)","name_zh",{maxlength:"120"}),fld("名称(英文,选填)","name_en",{maxlength:"160"}),
    h("div",{class:"two"},fld("规格型号(中文)","spec_zh",{maxlength:"160"}),fld("规格型号(英文,选填)","spec_en",{maxlength:"160"})),
    h("div",{class:"two"},fld("单位(中文,如 个)","unit_zh",{maxlength:"20"}),fld("单位(英文,如 pc)","unit_en",{maxlength:"20"})),
    h("div",{class:"two"},fld("价格(¥,留空=询价)","price",{inputmode:"decimal",maxlength:"40"}),fld("排序号(小的排前面)","sort",{type:"number",inputmode:"numeric"})),
    h("label",{class:"ck"},act,"上架(顾客可以看到)"),
    h("div",null,h("div",{style:"font-weight:600;font-size:.9rem;margin-bottom:6px"},"图片"),photoBox,photoNote,addBtn,fileIn),
    msg,
    h("div",{class:"acts2"},saveBtn,h("button",{class:"btn",type:"button",onclick:()=>dlg.close()},"关闭"),cur.id?h("button",{class:"btn bad",type:"button",onclick:del},"删除商品"):null)));
  dlg.addEventListener("close",()=>dlg.remove());
  document.body.append(dlg);drawPhotos();dlg.showModal();
}
async function shrink(file,max=1200){
  let src,w,hh;
  try{src=await createImageBitmap(file);w=src.width;hh=src.height}
  catch(e){
    src=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=URL.createObjectURL(file)});w=src.naturalWidth;hh=src.naturalHeight;
  }
  const sc=Math.min(1,max/Math.max(w,hh)),cw=Math.round(w*sc),ch=Math.round(hh*sc);
  const cv=document.createElement("canvas");cv.width=cw;cv.height=ch;
  const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,cw,ch);cx.drawImage(src,0,0,cw,ch);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",0.82));
  if(!blob)throw new Error("无法处理这张图片");
  return blob;
}

/* ---------- settings ---------- */
async function getJson(key){const {data}=await sb.from("settings").select("value").eq("key",key).maybeSingle();return data?data.value:null}
async function putJson(key,value){return sb.from("settings").upsert({key,value,updated_at:new Date().toISOString()})}
async function getSecrets(){const {data}=await sb.from("secrets").select("key,value");const m={};(data||[]).forEach(r=>{m[r.key]=r.value});return m}
async function putSecrets(obj){return sb.from("secrets").upsert(Object.entries(obj).map(([key,value])=>({key,value:String(value)})))}

async function renderSettings(){
  const m=document.getElementById("main");m.replaceChildren();
  const shop=Object.assign({hours:"08:00 – 20:00",place:"Kajola, Ogun State",nameZh:"临沂五金供应商",nameEn:"linyihardwarestore.com",addrEn:"WH4Q+7R, Kajola, Ogun State, Nigeria",mapQuery:"WH4Q+7R Kajola, Ogun State, Nigeria",mapUrl:"https://maps.app.goo.gl/GJhfdaFFiNZYHAkG7"},await getJson("shop")||{});
  const sec=await getSecrets();
  const {data:staff}=await sb.from("staff").select("email,note").order("email");

  /* shop info */
  const sf={};
  const sfld=(label,key,hint)=>{const i=h("input",{type:"text",value:shop[key]||"",maxlength:"200"});sf[key]=i;return h("label",null,label,i,hint?h("span",{class:"mut small",style:"font-weight:400"},hint):null)};
  const smsg=h("p",{class:"msg",role:"status"});
  m.append(h("section",{class:"sect"},h("h2",null,"店铺信息"),
    h("div",{class:"fm",style:"padding:0"},
      sfld("营业时间","hours","会显示在网站首页和“到店”部分。"),
      sfld("店名(中文)","nameZh"),sfld("店名(英文)","nameEn"),sfld("地区(首页小字)","place"),
      sfld("地址(英文)","addrEn"),sfld("地图搜索词","mapQuery","网站里的 Google 地图用这个定位。"),sfld("Google 地图链接","mapUrl","“在 Google 地图中打开”按钮用这个链接。")),
    smsg,h("div",null,h("button",{class:"btn pri",onclick:async e=>{
      const v={};Object.keys(sf).forEach(k=>{v[k]=sf[k].value.trim()});
      e.target.disabled=true;const {error}=await putJson("shop",v);e.target.disabled=false;
      setMsg(smsg,error?"保存失败:"+error.message:"已保存,网站会在刷新后更新。",!error);
    }},"保存"))));

  /* categories */
  const cl=cats.map(c=>({k:c.k,n:c.n.slice()}));
  const crowBox=h("div",{class:"fm",style:"padding:0"});
  const cmsg=h("p",{class:"msg",role:"status"});
  function drawCats(){
    crowBox.replaceChildren();
    cl.forEach(c=>crowBox.append(h("div",{class:"crow"},
      h("input",{type:"text",value:c.n[0],"aria-label":"分类中文名",oninput:e=>{c.n[0]=e.target.value}}),
      h("input",{type:"text",value:c.n[1]||"","aria-label":"分类英文名",oninput:e=>{c.n[1]=e.target.value}}))));
  }
  drawCats();
  m.append(h("section",{class:"sect"},h("h2",null,"商品分类"),h("p",{class:"hint"},"改名字或新增分类。分类下有商品时不能删除,所以这里没有删除按钮。"),crowBox,cmsg,
    h("div",{class:"acts2"},
      h("button",{class:"btn",onclick:()=>{cl.push({k:"c"+Date.now().toString(36),n:["新分类","New category"]});drawCats()}},"+ 新增分类"),
      h("button",{class:"btn pri",onclick:async e=>{
        const clean=cl.map(c=>({k:c.k,n:[c.n[0].trim()||"未命名",(c.n[1]||"").trim()||c.n[0].trim()||"Unnamed"]}));
        e.target.disabled=true;const {error}=await putJson("cats",clean);e.target.disabled=false;
        if(!error){cats=clean;}
        setMsg(cmsg,error?"保存失败:"+error.message:"已保存。",!error);
      }},"保存分类"))));

  /* notifications */
  const wc=h("input",{type:"password",autocomplete:"off",value:sec.wecom_webhook||"",placeholder:"https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=…"});
  const wcOn=h("input",{type:"checkbox",checked:sec.notify_wecom==="1"});
  const rk=h("input",{type:"password",autocomplete:"off",value:sec.resend_key||"",placeholder:"re_…"});
  const em=h("input",{type:"text",value:sec.email_to||"",placeholder:"收件邮箱,多个用逗号隔开"});
  const ef=h("input",{type:"text",value:sec.email_from||"",placeholder:"留空则使用 onboarding@resend.dev"});
  const emOn=h("input",{type:"checkbox",checked:sec.notify_email==="1"});
  const nmsg=h("p",{class:"msg",role:"status"});
  m.append(h("section",{class:"sect"},h("h2",null,"新预约通知"),
    h("p",{class:"hint"},"有人提交预约时,自动发到企业微信群和/或邮箱。两个可以同时开,也可以只开一个。"),
    h("div",{class:"fm",style:"padding:0"},
      h("label",{class:"ck"},wcOn,"发到企业微信群"),
      h("label",null,"企业微信群机器人地址(Webhook)",wc,h("span",{class:"mut small",style:"font-weight:400"},"在企业微信群里:群设置 → 添加群机器人 → 复制 Webhook 地址。")),
      h("label",{class:"ck"},emOn,"发到邮箱"),
      h("label",null,"收件邮箱",em),
      h("label",null,"发件地址(选填)",ef),
      h("label",null,"Resend 密钥",rk,h("span",{class:"mut small",style:"font-weight:400"},"邮件通过 resend.com 发送。用自己的域名发件需要先在 Resend 验证域名;不填发件地址时只能发给注册 Resend 的那个邮箱。"))),
    nmsg,
    h("div",{class:"acts2"},
      h("button",{class:"btn pri",onclick:async e=>{
        e.target.disabled=true;
        const {error}=await putSecrets({wecom_webhook:wc.value.trim(),notify_wecom:wcOn.checked?"1":"0",resend_key:rk.value.trim(),email_to:em.value.trim(),email_from:ef.value.trim(),notify_email:emOn.checked?"1":"0"});
        e.target.disabled=false;setMsg(nmsg,error?"保存失败:"+error.message:"已保存。",!error);
      }},"保存通知设置"),
      h("button",{class:"btn",onclick:async e=>{
        e.target.disabled=true;setMsg(nmsg,"正在发送测试通知…",true);
        const r=await sb.rpc("test_notify");
        if(r.error){setMsg(nmsg,"发送失败:"+r.error.message,false);e.target.disabled=false;return}
        await sleep(3500);
        const s=await sb.rpc("last_notify_status");
        e.target.disabled=false;
        const row=s.data&&s.data[0];
        if(!row)setMsg(nmsg,"还没有收到回应。请先保存通知设置,并确认至少打开了一个通知。",false);
        else if(row.status_code>=200&&row.status_code<300)setMsg(nmsg,"测试通知已发出,请去企业微信群或邮箱查看。(返回:"+row.status_code+")",true);
        else setMsg(nmsg,"对方返回错误 "+row.status_code+":"+(row.body||""),false);
      }},"发送测试通知"))));

  /* staff */
  const stBox=h("div",{class:"fm",style:"padding:0"});
  const stmsg=h("p",{class:"msg",role:"status"});
  let list=(staff||[]).slice();
  function drawStaff(){
    stBox.replaceChildren();
    list.forEach(s=>stBox.append(h("div",{class:"bh"},h("span",null,s.email),
      s.email.toLowerCase()===user.email.toLowerCase()?h("span",{class:"mut small"},"(你自己)"):
      h("button",{class:"btn bad",onclick:async()=>{
        if(!confirm("确定要移除 "+s.email+" 的后台权限吗?"))return;
        const {error}=await sb.from("staff").delete().eq("email",s.email);
        if(error){setMsg(stmsg,"移除失败:"+error.message,false);return}
        list=list.filter(x=>x.email!==s.email);drawStaff();setMsg(stmsg,"已移除。",true);
      }},"移除"))));
  }
  drawStaff();
  const newEmail=h("input",{type:"email",placeholder:"新员工的邮箱"});
  m.append(h("section",{class:"sect"},h("h2",null,"员工名单"),
    h("p",{class:"hint"},"只有名单里的邮箱能进后台。新员工要先在 Supabase 后台的 Authentication → Users 里建好登录账号(邮箱 + 密码),再把同一个邮箱加到这里。"),
    stBox,h("div",{class:"acts2"},newEmail,h("button",{class:"btn pri",onclick:async()=>{
      const v=newEmail.value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(v)){setMsg(stmsg,"邮箱格式不对。",false);return}
      const {error}=await sb.from("staff").insert({email:v});
      if(error){setMsg(stmsg,"添加失败:"+error.message,false);return}
      list.push({email:v});newEmail.value="";drawStaff();setMsg(stmsg,"已添加。",true);
    }},"添加")),stmsg));

  /* password */
  const np=h("input",{type:"password",autocomplete:"new-password",placeholder:"新密码(至少 8 位)"});
  const pmsg=h("p",{class:"msg",role:"status"});
  m.append(h("section",{class:"sect"},h("h2",null,"修改我的密码"),np,pmsg,h("div",null,h("button",{class:"btn",onclick:async e=>{
    if(np.value.length<8){setMsg(pmsg,"密码至少 8 位。",false);return}
    e.target.disabled=true;const {error}=await sb.auth.updateUser({password:np.value});e.target.disabled=false;
    if(!error)np.value="";setMsg(pmsg,error?"修改失败:"+error.message:"密码已修改。",!error);
  }},"修改密码"))));
}

start();
