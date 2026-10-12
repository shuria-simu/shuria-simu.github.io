const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const STORAGE_BUCKET = "portfolio";

async function uploadImage(file, folder="general"){
  if(!file) return null;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ext.replace(/[^a-z0-9]/g,"") || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${safeExt}`;
  const path = `${folder}/${fileName}`;

  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });

  if(error) throw error;

  const { data } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
const loginView=document.getElementById("loginView"), dashboardView=document.getElementById("dashboardView"), content=document.getElementById("adminContent");

function authEmail(userId){
  const clean=userId.trim().toLowerCase().replace(/[^a-z0-9._-]/g,"");
  return `${clean}@${ADMIN_DOMAIN}`;
}

document.getElementById("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const userId=document.getElementById("userId").value, password=document.getElementById("password").value;
  const status=document.getElementById("loginStatus"); status.textContent="Checking...";
  const {error}=await db.auth.signInWithPassword({email:authEmail(userId),password});
  if(error){status.textContent="Wrong User ID or Password.";return}
  await enterAdmin();
});

document.getElementById("logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();location.reload()});

async function enterAdmin(){
  const {data:{user}}=await db.auth.getUser();
  if(!user){loginView.classList.remove("hidden");dashboardView.classList.add("hidden");return}
  const {data:profile}=await db.from("profiles").select("role,username").eq("id",user.id).maybeSingle();
  if(!profile || !["admin","editor"].includes(profile.role)){await db.auth.signOut();document.getElementById("loginStatus").textContent="This account has no admin access.";return}
  loginView.classList.add("hidden");dashboardView.classList.remove("hidden");showDashboard();
}

document.querySelectorAll(".sidebar [data-view]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".sidebar [data-view]").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  const v=btn.dataset.view;
  if(v==="dashboard")showDashboard();
  else if(v==="projects")showProjects();
  else if(v==="services")showSimple("services","Services",["title","description","sort_order"]);
  else if(v==="experience")showSimple("experience","Experience",["position","company","location","period","sort_order"]);
  else if(v==="education")showSimple("education","Education",["institute","degree","subject","period","sort_order"]);
  else if(v==="awards")showSimple("awards","Awards",["title","organization","year","sort_order"]);
  else if(v==="testimonials")showSimple("testimonials","Testimonials",["client_name","company","review","rating","sort_order"]);
  else if(v==="messages")showMessages();
  else if(v==="settings")showSettings();
}));

async function showDashboard(){
  const tables=["projects","messages","services","awards"], vals={};
  for(const t of tables){const {count}=await db.from(t).select("*",{count:"exact",head:true});vals[t]=count||0}
  content.innerHTML=`<div class="admin-head"><div><span>ADMIN</span><h1>Dashboard</h1></div></div>
  <div class="admin-cards">
    <div class="admin-card"><small>Projects</small><b>${vals.projects}</b></div>
    <div class="admin-card"><small>Messages</small><b>${vals.messages}</b></div>
    <div class="admin-card"><small>Services</small><b>${vals.services}</b></div>
    <div class="admin-card"><small>Awards</small><b>${vals.awards}</b></div>
  </div>
  <section class="admin-section"><h2>Welcome, Shuria 🌸</h2><p class="muted">Use the sidebar to update website content. Changes appear on the public site from Supabase.</p></section>`;
}

async function showProjects(){
  const {data=[]}=await db.from("projects").select("*").order("sort_order");
  content.innerHTML=`<div class="admin-head"><div><span>CMS</span><h1>Portfolio</h1></div><button class="btn dark" onclick="projectForm()">+ Add Project</button></div>
  <section class="admin-section"><table class="admin-table"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Action</th></tr></thead><tbody>
  ${data.map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.category||"")}</td><td>${x.published?"Live":"Draft"}</td><td><button class="action-btn edit" onclick='projectForm(${JSON.stringify(x)})'>Edit</button> <button class="action-btn danger" onclick="removeRow('projects','${x.id}',showProjects)">Delete</button></td></tr>`).join("")}
  </tbody></table></section>`;
}
window.projectForm=(x={})=>{
  content.innerHTML=`<div class="admin-head"><div><span>PORTFOLIO</span><h1>${x.id?"Edit":"Add"} Project</h1></div></div>
  <section class="admin-section"><form id="projectForm" class="admin-form">
  <div class="row"><input name="title" placeholder="Title" value="${attr(x.title)}" required><input name="category" placeholder="Category" value="${attr(x.category)}"></div>
  <div class="row"><input name="year" type="number" placeholder="Year" value="${attr(x.year)}"><input name="sort_order" type="number" placeholder="Sort Order" value="${attr(x.sort_order||0)}"></div>

  <label>Thumbnail Image
    <input id="projectImageFile" type="file" accept="image/*">
  </label>

  ${x.thumbnail_url ? `<div><small>Current Image</small><img src="${attr(x.thumbnail_url)}" style="margin-top:8px;width:180px;height:120px;object-fit:cover;border-radius:14px;border:1px solid #eadde3"></div>` : ""}

  <textarea name="description" rows="5" placeholder="Description">${esc(x.description||"")}</textarea>
  <label><input name="featured" type="checkbox" ${x.featured?"checked":""}> Featured</label>
  <label><input name="published" type="checkbox" ${x.published?"checked":""}> Published</label>
  <button class="btn dark" id="projectSaveBtn">Save Project</button>
  <p id="projectUploadStatus"></p>
  </form></section>`;

  document.getElementById("projectForm").onsubmit=async e=>{
    e.preventDefault();

    const btn=document.getElementById("projectSaveBtn");
    const status=document.getElementById("projectUploadStatus");
    btn.disabled=true;
    btn.textContent="Saving...";
    status.textContent="";

    try{
      const f=new FormData(e.currentTarget);
      const p=Object.fromEntries(f.entries());

      delete p.projectImageFile;

      p.year=p.year?Number(p.year):null;
      p.sort_order=Number(p.sort_order||0);
      p.featured=f.get("featured")==="on";
      p.published=f.get("published")==="on";

      const file=document.getElementById("projectImageFile").files[0];
      if(file){
        status.textContent="Uploading image...";
        p.thumbnail_url=await uploadImage(file,"projects");
      }

      let q=x.id
        ? db.from("projects").update(p).eq("id",x.id)
        : db.from("projects").insert(p);

      const {error}=await q;
      if(error) throw error;

      showProjects();
    }catch(err){
      status.textContent=err.message || "Could not save project.";
      btn.disabled=false;
      btn.textContent="Save Project";
    }
  };
};

window.showSimple=async(table,title,fields)=>{
  const {data=[]}=await db.from(table).select("*").order("sort_order");
  content.innerHTML=`<div class="admin-head"><div><span>CMS</span><h1>${title}</h1></div><button class="btn dark" id="addSimple">+ Add</button></div>
  <section class="admin-section"><table class="admin-table"><thead><tr><th>Main</th><th>Detail</th><th>Action</th></tr></thead><tbody>
  ${data.map(x=>`<tr><td>${esc(x[fields[0]]||"")}</td><td>${esc(x[fields[1]]||"")}</td><td><button class="action-btn edit" data-edit='${attr(JSON.stringify(x))}'>Edit</button> <button class="action-btn danger" onclick="removeRow('${table}','${x.id}',()=>showSimple('${table}','${title}',${JSON.stringify(fields)}))">Delete</button></td></tr>`).join("")}</tbody></table></section>`;
  document.getElementById("addSimple").onclick=()=>simpleForm(table,title,fields,{});
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>simpleForm(table,title,fields,JSON.parse(b.dataset.edit)));
}
window.simpleForm=(table,title,fields,x={})=>{
  content.innerHTML=`<div class="admin-head"><div><span>CMS</span><h1>${x.id?"Edit":"Add"} ${title}</h1></div></div>
  <section class="admin-section"><form id="simpleForm" class="admin-form">
  ${fields.map(f=>f==="description"||f==="review"?`<textarea name="${f}" rows="5" placeholder="${nice(f)}">${esc(x[f]||"")}</textarea>`:`<input name="${f}" placeholder="${nice(f)}" value="${attr(x[f])}">`).join("")}
  ${["services","testimonials"].includes(table)?`<label><input type="checkbox" name="published" ${x.published!==false?"checked":""}> Published</label>`:""}
  <button class="btn dark">Save</button></form></section>`;
  document.getElementById("simpleForm").onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.currentTarget),p=Object.fromEntries(f.entries());
    if("sort_order"in p)p.sort_order=Number(p.sort_order||0);if("year"in p)p.year=p.year?Number(p.year):null;if("rating"in p)p.rating=Number(p.rating||5);
    if(["services","testimonials"].includes(table))p.published=f.get("published")==="on";
    let q=x.id?db.from(table).update(p).eq("id",x.id):db.from(table).insert(p);const {error}=await q;if(error)return alert(error.message);showSimple(table,title,fields);
  };
}

async function showMessages(){
  const {data=[]}=await db.from("messages").select("*").order("created_at",{ascending:false});
  content.innerHTML=`<div class="admin-head"><div><span>INBOX</span><h1>Messages</h1></div></div><section class="admin-section">
  ${data.map(x=>`<article style="padding:18px 0;border-bottom:1px solid #eee"><b>${esc(x.name)}</b> · <small>${esc(x.email)}</small><p>${esc(x.subject||"")}</p><p class="muted">${esc(x.message)}</p><button class="action-btn danger" onclick="removeRow('messages','${x.id}',showMessages)">Delete</button></article>`).join("")||"<p>No messages yet.</p>"}</section>`;
}

async function showSettings(){
  const {data:x={}}=await db.from("settings").select("*").eq("id",1).maybeSingle();

  content.innerHTML=`<div class="admin-head"><div><span>WEBSITE</span><h1>Settings</h1></div></div><section class="admin-section">
  <form id="settingsForm" class="admin-form">

  <label>Web Profile Pic
    <input id="profileImageFile" type="file" accept="image/*">
  </label>
  ${x.profile_image ? `<div><small>Current Web Profile Pic</small><img src="${attr(x.profile_image)}" style="margin-top:8px;width:140px;height:170px;object-fit:cover;border-radius:18px;border:1px solid #eadde3"></div>` : ""}

  <label>Resume PDF
    <input id="resumeFile" type="file" accept="application/pdf">
  </label>
  ${x.resume_url ? `<p><a target="_blank" href="${attr(x.resume_url)}">Current Resume ↗</a></p>` : ""}

  <input name="email" placeholder="Contact Email" value="${attr(x.email)}">
  <textarea name="hero_text" rows="3" placeholder="Hero Text">${esc(x.hero_text||"")}</textarea>
  <textarea name="about_text" rows="5" placeholder="About Text">${esc(x.about_text||"")}</textarea>
  <div class="row"><input name="speciality" placeholder="Speciality" value="${attr(x.speciality)}"><input name="location" placeholder="Location" value="${attr(x.location)}"></div>
  <div class="row"><input name="languages" placeholder="Languages" value="${attr(x.languages)}"><input name="status" placeholder="Status" value="${attr(x.status)}"></div>
  <div class="row"><input name="client_count" type="number" placeholder="Client Count" value="${attr(x.client_count)}"><input name="years_creating" type="number" placeholder="Years Creating" value="${attr(x.years_creating)}"></div>

  <button class="btn dark" id="settingsSaveBtn">Save Settings</button>
  <p id="settingsStatus"></p>
  </form></section>`;

  document.getElementById("settingsForm").onsubmit=async e=>{
    e.preventDefault();

    const btn=document.getElementById("settingsSaveBtn");
    const status=document.getElementById("settingsStatus");
    btn.disabled=true;
    btn.textContent="Saving...";
    status.textContent="";

    try{
      const p=Object.fromEntries(new FormData(e.currentTarget).entries());
      p.id=1;
      p.client_count=Number(p.client_count||0);
      p.years_creating=Number(p.years_creating||0);

      const profileFile=document.getElementById("profileImageFile").files[0];
      const resumeFile=document.getElementById("resumeFile").files[0];

      if(profileFile){
        status.textContent="Uploading Web Profile Pic...";
        p.profile_image=await uploadImage(profileFile,"profile");
      }else if(x.profile_image){
        p.profile_image=x.profile_image;
      }

      if(resumeFile){
        status.textContent="Uploading resume...";
        const path = `resume/${Date.now()}-${resumeFile.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
        const {error}=await db.storage.from(STORAGE_BUCKET).upload(path,resumeFile,{
          cacheControl:"3600",
          upsert:false,
          contentType:"application/pdf"
        });
        if(error) throw error;
        const {data}=db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        p.resume_url=data.publicUrl;
      }else if(x.resume_url){
        p.resume_url=x.resume_url;
      }

      const {error}=await db.from("settings").upsert(p);
      if(error) throw error;

      status.textContent="Saved successfully ✨";
      btn.disabled=false;
      btn.textContent="Save Settings";
      setTimeout(()=>showSettings(),700);
    }catch(err){
      status.textContent=err.message || "Could not save settings.";
      btn.disabled=false;
      btn.textContent="Save Settings";
    }
  };
}

window.removeRow=async(table,id,cb)=>{if(!confirm("Delete this item?"))return;const {error}=await db.from(table).delete().eq("id",id);if(error)return alert(error.message);cb();}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function attr(s){return esc(s??"")}
function nice(s){return s.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}

enterAdmin();
