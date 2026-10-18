const posts=[
{d:"2026-10-02",t:"用 Rust 重写热路径：延迟从 18ms 降到 2ms",s:"一次真实的性能优化复盘：火焰图、内存分配与零拷贝。",g:["Rust","性能"],r:9,c:`<p>线上网关的 P99 延迟一直压不下去。火焰图显示，大部分时间花在 JSON 反序列化和频繁的堆分配上。</p><pre>// 使用 Cow 避免不必要的拷贝\nfn parse(input: &amp;str) -&gt; Cow&lt;str&gt; {\n    if input.contains('\\\\') { Cow::Owned(unescape(input)) }\n    else { Cow::Borrowed(input) }\n}</pre><p>把热路径改成借用而非克隆之后，分配次数下降了 90%，延迟随之下降。关键经验：先测量，再优化。</p>`},
{d:"2026-09-14",t:"从零实现一个 RAG：别急着上向量库",s:"先用 BM25 打底，再逐步引入向量检索与重排，效果一步步量化。",g:["AI","后端"],r:12,c:`<p>很多团队一上来就部署向量数据库，却没有评测集。我的做法是先建立 50 条真实问题的评测集。</p><pre>score = 0.6 * bm25(q, doc) + 0.4 * cosine(emb(q), emb(doc))</pre><p>混合检索在我们的数据上比纯向量召回高出 11 个点，而且更容易调试。</p>`},
{d:"2026-08-21",t:"WebGL 粒子系统入门：十万个点如何不卡",s:"用 instancing 与 GPU 计算位置，让页面保持 60 帧。",g:["前端","WebGL"],r:8,c:`<p>CPU 逐个更新粒子位置是卡顿的根源。把位置计算搬到顶点着色器里，CPU 只负责传递时间。</p><pre>vec3 p = base + vec3(sin(t + id), cos(t * .7 + id), 0.);\ngl_Position = proj * view * vec4(p, 1.);</pre><p>这样十万个粒子也只需要一次 draw call。</p>`},
{d:"2026-07-30",t:"Postgres 慢查询排查清单",s:"EXPLAIN、索引、统计信息，一份可以直接照着做的流程。",g:["后端","数据库"],r:7,c:`<p>先看 EXPLAIN (ANALYZE, BUFFERS)，再判断是缺索引、统计信息过期，还是写法问题。</p><pre>EXPLAIN (ANALYZE, BUFFERS)\nSELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;</pre><p>组合索引 (user_id, created_at DESC) 通常能把这类查询降到毫秒级。</p>`}
];
const $=s=>document.querySelector(s);
const tags=["全部",...new Set(posts.flatMap(p=>p.g))];let cur="全部";
function render(){
  $("#tags").innerHTML=tags.map(t=>`<button class="tag ${t===cur?"on":""}" data-t="${t}">${t}</button>`).join("");
  $("#list").innerHTML=posts.map((p,i)=>({p,i})).filter(o=>cur==="全部"||o.p.g.includes(cur)).map(({p,i})=>`<button class="post" data-i="${i}"><time>${p.d}</time><div><h3>${p.t}</h3><p>${p.s}</p><div class="t">${p.g.map(x=>`<span>#${x}</span>`).join("")}<span>${p.r} 分钟阅读</span></div></div></button>`).join("");
}
$("#tags").onclick=e=>{const t=e.target.dataset.t;if(t){cur=t;render()}};
$("#list").onclick=e=>{const b=e.target.closest(".post");if(!b)return;const p=posts[b.dataset.i];
  $("#art").innerHTML=`<h3>${p.t}</h3><div class="m">${p.d} · ${p.r} 分钟阅读</div>${p.c}`;$("#modal").classList.add("open");document.body.style.overflow="hidden"};
function closeM(){$("#modal").classList.remove("open");document.body.style.overflow=""}
$("#close").onclick=closeM;$("#modal").onclick=e=>{if(e.target.id==="modal")closeM()};
addEventListener("keydown",e=>{if(e.key==="Escape")closeM()});
render();

// 主题切换
$("#theme").onclick=()=>{const r=document.documentElement;const dark=getComputedStyle(r).getPropertyValue("--bg").trim()==="#0e0b1f";r.dataset.theme=dark?"light":"dark";colors()};

// 阅读进度
addEventListener("scroll",()=>{const h=document.documentElement;$("#bar").style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+"%"});

// 打字机
const lines=["$ whoami → 林深","$ cargo build --release","$ kubectl rollout status","$ echo \"hello, world\""];
let li=0,ci=0,del=false;const ty=$("#type");
(function tick(){const L=lines[li];ty.textContent=L.slice(0,ci);
  if(!del&&ci===L.length){del=true;return setTimeout(tick,1600)}
  if(del&&ci===0){del=false;li=(li+1)%lines.length}
  ci+=del?-1:1;setTimeout(tick,del?30:70)})();

// 交互星图
const cv=$("#net"),cx=cv.getContext("2d");let W,H,pts=[],m={x:-999,y:-999},col={};
function colors(){const s=getComputedStyle(document.documentElement);col={a:s.getPropertyValue("--a").trim(),b:s.getPropertyValue("--b").trim(),c:s.getPropertyValue("--c").trim()}}
function size(){const d=devicePixelRatio||1;W=cv.clientWidth;H=cv.clientHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);
  const n=Math.min(110,Math.floor(W*H/11000));pts=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,k:Math.random()}))}
colors();size();addEventListener("resize",size);
cv.parentElement.addEventListener("pointermove",e=>{const r=cv.getBoundingClientRect();m.x=e.clientX-r.left;m.y=e.clientY-r.top});
cv.parentElement.addEventListener("pointerleave",()=>{m.x=m.y=-999});
function frame(){cx.clearRect(0,0,W,H);
  for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
    const dx=m.x-p.x,dy=m.y-p.y,d=Math.hypot(dx,dy);if(d<160){p.x+=dx*.012;p.y+=dy*.012}}
  for(let i=0;i<pts.length;i++){const p=pts[i];
    for(let j=i+1;j<pts.length;j++){const q=pts[j],d=Math.hypot(p.x-q.x,p.y-q.y);
      if(d<130){cx.globalAlpha=(1-d/130)*.5;cx.strokeStyle=col.a;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(q.x,q.y);cx.stroke()}}
    const dm=Math.hypot(m.x-p.x,m.y-p.y);
    if(dm<180){cx.globalAlpha=(1-dm/180)*.9;cx.strokeStyle=col.b;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(m.x,m.y);cx.stroke()}
    cx.globalAlpha=.9;cx.fillStyle=p.k>.5?col.b:col.c;cx.beginPath();cx.arc(p.x,p.y,1.8+p.k*1.6,0,7);cx.fill()}
  requestAnimationFrame(frame)}
if(!matchMedia("(prefers-reduced-motion:reduce)").matches)frame();else{pts.forEach(p=>{p.vx=p.vy=0});frame()}
matchMedia("(prefers-color-scheme:dark)").addEventListener("change",colors);
