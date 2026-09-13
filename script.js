const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
document.getElementById("year").textContent = new Date().getFullYear();

let allProjects = [];

async function loadSettings(){
  const { data } = await db.from("settings").select("*").eq("id",1).maybeSingle();
  if(!data) return;
  if(data.hero_text) document.getElementById("heroText").textContent = data.hero_text;
  if(data.about_text) document.getElementById("aboutText").textContent = data.about_text;
 if(data.profile_image){
  const img = document.getElementById("profileImage");
  img.src = data.profile_image;
  img.style.display = "block";
}
  if(data.resume_url){ const r=document.getElementById("resumeLink"); r.href=data.resume_url; }
  if(data.email) document.getElementById("contactEmail").textContent = data.email;
  if(data.speciality) document.getElementById("speciality").textContent = data.speciality;
  if(data.location) document.getElementById("location").textContent = data.location;
  if(data.languages) document.getElementById("languages").textContent = data.languages;
  if(data.status) document.getElementById("status").textContent = data.status;
  if(data.client_count) document.getElementById("clientCount").textContent = data.client_count + "+";
  if(data.years_creating) document.getElementById("yearCount").textContent = data.years_creating + "+";
}

async function loadServices(){
  const {data=[]}=await db.from("services").select("*").eq("published",true).order("sort_order");
  document.getElementById("serviceGrid").innerHTML=data.map((x,i)=>`
    <article class="service-card"><span class="num">0${i+1}</span><h3>${esc(x.title)}</h3><p>${esc(x.description||"")}</p></article>`).join("");
}

async function loadProjects(){
  const {data=[]}=await db.from("projects").select("*").eq("published",true).order("sort_order");
  allProjects=data;
  document.getElementById("projectCount").textContent=data.length+"+";
  const cats=["All",...new Set(data.map(x=>x.category).filter(Boolean))];
  document.getElementById("filters").innerHTML=cats.map((c,i)=>`<button class="${i===0?"active":""}" onclick="filterProjects('${escAttr(c)}',this)">${esc(c)}</button>`).join("");
  renderProjects(data);
}
function renderProjects(rows){
  document.getElementById("portfolioGrid").innerHTML=rows.map(x=>`
  <article class="project-card">
    <div class="project-image"><img src="${escAttr(x.thumbnail_url||placeholder())}" alt="${escAttr(x.title)}"></div>
    <small>${esc(x.category||"Design")} · ${esc(x.year||"")}</small>
    <h3>${esc(x.title)}</h3>
    <p class="muted">${esc(x.description||"")}</p>
  </article>`).join("");
}
window.filterProjects=(c,el)=>{
  document.querySelectorAll(".filters button").forEach(b=>b.classList.remove("active")); el.classList.add("active");
  renderProjects(c==="All"?allProjects:allProjects.filter(x=>x.category===c));
};

async function loadExperience(){
  const {data=[]}=await db.from("experience").select("*").order("sort_order");
  document.getElementById("experienceList").innerHTML=data.map(x=>`<article><small>${esc(x.period||"")}</small><h4>${esc(x.position)}</h4><p>${esc(x.company)}${x.location?" · "+esc(x.location):""}</p></article>`).join("");
}
async function loadEducation(){
  const {data=[]}=await db.from("education").select("*").order("sort_order");
  document.getElementById("educationList").innerHTML=data.map(x=>`<article><small>${esc(x.period||"")}</small><h4>${esc(x.degree||"")}</h4><p>${esc(x.institute)}${x.subject?" · "+esc(x.subject):""}</p></article>`).join("");
}
async function loadAwards(){
  const {data=[]}=await db.from("awards").select("*").order("sort_order");
  document.getElementById("awardGrid").innerHTML=data.map((x,i)=>`<article class="award-card"><span class="num">${esc(String(x.year||""))}</span><h3>${esc(x.title)}</h3><p>${esc(x.organization||"")}</p></article>`).join("");
}
async function loadTestimonials(){
  const {data=[]}=await db.from("testimonials").select("*").eq("published",true).order("sort_order");
  document.getElementById("testimonialGrid").innerHTML=data.map(x=>`<article class="testimonial-card"><div class="stars">${"★".repeat(x.rating||5)}</div><p>“${esc(x.review)}”</p><b>${esc(x.client_name)}</b><small>${esc(x.company||"")}</small></article>`).join("");
}
async function loadSocial(){
  const {data=[]}=await db.from("social_links").select("*").order("sort_order");
  document.getElementById("socialLinks").innerHTML=data.map(x=>`<a target="_blank" rel="noopener" href="${escAttr(x.url)}">${esc(x.platform)}</a>`).join("");
}

document.getElementById("contactForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const f=new FormData(e.currentTarget), status=document.getElementById("formStatus");
  status.textContent="Sending...";
  const payload=Object.fromEntries(f.entries());
  const {error}=await db.from("messages").insert(payload);
  if(error){status.textContent="Could not send. Please try again.";return}
  status.textContent="Message sent successfully ✨"; e.currentTarget.reset();
});

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escAttr(s){return esc(s)}
function placeholder(){return "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1200&auto=format&fit=crop"}

Promise.allSettled([loadSettings(),loadServices(),loadProjects(),loadExperience(),loadEducation(),loadAwards(),loadTestimonials(),loadSocial()]);
