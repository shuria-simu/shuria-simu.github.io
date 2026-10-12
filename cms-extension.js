
/* Expanded admin CMS – existing authentication and services stay unchanged. */
const cmsViews={
  portfolio_categories:{title:'Portfolio Categories',fields:['name','slug','description','cover_url','link_url','sort_order'],file:'cover_url'},
  navigation_items:{title:'Navigation Menu',fields:['label','href','sort_order']},
  custom_sections:{title:'Custom Sections',fields:['eyebrow','heading','body','image_url','button_label','button_url','sort_order'],file:'image_url'},
  social_links:{title:'Social Links',fields:['platform','url','sort_order']}
};
const cmsEscape=esc;
function cmsURL(value){try{const u=new URL(value,location.href);return ['https:','http:','mailto:'].includes(u.protocol)?u.href:'#'}catch{return '#'}}
function cmsStatus(msg){return '<p class="cms-helper">'+cmsEscape(msg)+'</p>'}
function cmsSwitch(name){document.querySelectorAll('.sidebar [data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===name))}
async function cmsTable(table){
 const conf=cmsViews[table],{data,error}=await db.from(table).select('*').order('sort_order');
 if(error)return content.innerHTML='<p>'+esc(error.message)+'</p>';
 content.innerHTML='<div class="admin-head"><div><span>CONTENT MANAGER</span><h1>'+conf.title+'</h1></div><button class="btn dark" id="cmsAdd">+ Add new</button></div>'+
 cmsStatus(table==='portfolio_categories'?'Organize unlimited designs by category. Each category automatically gets a shareable page.':table==='navigation_items'?'Use #section-id for internal links or full https:// links.':'Manage content without touching the code.')+
 '<section class="admin-section admin-table-wrapper"><table class="admin-table"><thead><tr><th>Name</th><th>Details</th><th>Visible</th><th>Actions</th></tr></thead><tbody>'+
 (data||[]).map((x,i)=>'<tr><td><b>'+esc(x.name||x.label||x.heading||x.platform||'Untitled')+'</b></td><td>'+esc(x.description||x.href||x.eyebrow||x.url||'')+'</td><td>'+(x.published===false?'Hidden':'Yes')+'</td><td><div class="cms-row-actions"><button class="action-btn edit" data-edit="'+i+'">Edit</button><button class="action-btn danger" data-remove="'+i+'">Delete</button></div></td></tr>').join('')+
 '</tbody></table></section>';
 document.getElementById('cmsAdd').onclick=()=>cmsForm(table,{});
 content.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>cmsForm(table,data[Number(b.dataset.edit)]));
 content.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeRow(table,data[Number(b.dataset.remove)].id,()=>cmsTable(table)));
}
function cmsForm(table,x={}){
 const c=cmsViews[table];content.innerHTML='<div class="admin-head"><div><span>CONTENT MANAGER</span><h1>'+(x.id?'Edit ':'Add ')+c.title+'</h1></div><button class="btn light" id="cmsBack">← Back</button></div><section class="admin-section"><form id="cmsForm" class="admin-form">'+
 c.fields.map(f=>f==='description'||f==='body'?'<label>'+nice(f)+'<textarea name="'+f+'" rows="5">'+esc(x[f]||'')+'</textarea></label>':'<label>'+nice(f)+'<input name="'+f+'" value="'+attr(x[f])+'" '+(f==='name'||f==='label'||f==='heading'||f==='platform'?'required':'')+'></label>').join('')+
 (c.file?'<label>Upload '+nice(c.file)+'<input id="cmsImage" type="file" accept="image/*"></label>':'')+
 (table!=='social_links'?'<label class="check-line"><input type="checkbox" name="published" '+(x.published!==false?'checked':'')+'> Visible on website</label>':'')+
 '<button class="btn dark">Save changes</button><p id="cmsMsg"></p></form></section>';
 document.getElementById('cmsBack').onclick=()=>cmsTable(table);
 document.getElementById('cmsForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),p=Object.fromEntries(f.entries());delete p.published;if(table!=='social_links')p.published=f.get('published')==='on';if('sort_order' in p)p.sort_order=Number(p.sort_order||0);
 if(table==='portfolio_categories'){p.name=p.name.trim();p.slug=(p.slug||p.name).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(!p.slug){document.getElementById('cmsMsg').textContent='Please enter an English slug.';return}}
 try{
 if(c.file){const file=document.getElementById('cmsImage')?.files[0];if(file)p[c.file]=await uploadImage(file,'cms')}
 const {error}=await (x.id?db.from(table).update(p).eq('id',x.id):db.from(table).insert(p));
 if(error)throw error;cmsTable(table);
 }catch(err){document.getElementById('cmsMsg').textContent=err.message||'Save failed'}
 };
}
function expandMenu(){
 const nav=document.querySelector('.sidebar nav');for(const [view,label] of [['portfolio_categories','Categories'],['navigation_items','Menu & Links'],['custom_sections','Custom Sections'],['social_links','Social Links']]){const b=document.createElement('button');b.textContent=label;b.dataset.view=view;nav.append(b);b.addEventListener('click',()=>{cmsSwitch(view);cmsTable(view)})}
}
expandMenu();
const originalSettings=showSettings;
window.showSettings=async function(){
 await originalSettings();const f=document.getElementById('settingsForm');if(!f)return;
 const {data:s={}}=await db.from('settings').select('*').eq('id',1).maybeSingle();
 const fields=[['brand_name','Brand / Logo Text'],['hero_kicker','Hero Eyebrow'],['hero_title','Main Hero Heading'],['about_heading','About Heading'],['services_heading','Services Heading'],['portfolio_heading','Portfolio Heading'],['experience_heading','Experience Heading'],['awards_heading','Awards Heading'],['testimonials_heading','Testimonials Heading'],['contact_heading','Contact Heading'],['contact_intro','Contact Description'],['footer_text','Footer Text'],['feature_label','Featured Label'],['accent_color','Accent Hex Color'],['favicon_url','Favicon URL (or upload below)'],['seo_title','SEO Page Title'],['seo_description','SEO Description'],['seo_keywords','SEO Search Keywords'],['og_image_url','Social Preview Image URL'],['portrait_position','Portrait Crop Position (e.g. center 25%)']];
 const heading=document.createElement('h2');heading.textContent='Website text, headings & appearance';f.insertBefore(heading,f.querySelector('#settingsSaveBtn'));
 fields.forEach(([key,label])=>{const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement(key==='contact_intro'?'textarea':'input');input.name=key;input.value=s?.[key]||'';input.placeholder=label;wrap.append(input);f.insertBefore(wrap,f.querySelector('#settingsSaveBtn'))});
 const upload=document.createElement('label');upload.textContent='Upload a new favicon (square PNG or ICO; max 2 MB)';
 const file=document.createElement('input');file.id='faviconFile';file.type='file';file.accept='image/png,image/x-icon,image/vnd.microsoft.icon,image/webp';upload.append(file);
 f.insertBefore(upload,f.querySelector('#settingsSaveBtn'));
 const help=document.createElement('p');help.className='cms-helper';help.textContent='Brand Name updates the header logo and footer. Uploading a favicon sets its URL here automatically. SEO fields improve the page information seen by browsers; Google chooses its own ranking and indexing.';
 f.insertBefore(help,f.querySelector('#settingsSaveBtn'));
 const originalSubmit=f.onsubmit;
 f.onsubmit=async function(e){
   e.preventDefault();
   const chosen=file.files[0];
   if(chosen) {
     const status=document.getElementById('settingsStatus');
     if(chosen.size>2*1024*1024){status.textContent='Favicon must be smaller than 2 MB.';return}
     const btn=document.getElementById('settingsSaveBtn');
     try {
       btn.disabled=true; status.textContent='Uploading favicon…';
       const newUrl=await uploadImage(chosen,'branding');
       const target=f.querySelector('[name="favicon_url"]');target.value=newUrl;
     }catch(err){status.textContent=err.message||'Favicon upload failed';btn.disabled=false;return}
   }
   return originalSubmit.call(f,e);
 };
};
const originalProjects=showProjects;
window.showProjects=async function(){
 const {data=[],error}=await db.from('projects').select('*').order('sort_order');
 if(error){content.textContent=error.message;return}
 content.innerHTML='<div class="admin-head"><div><span>PROJECT STUDIO</span><h1>Portfolio Projects</h1></div><button class="btn dark" id="addProject">+ New Project</button></div>'+
 cmsStatus('Featured projects appear first. Add unlimited photos, direct links and categories to every project.')+
 '<section class="admin-section admin-table-wrapper"><table class="admin-table"><thead><tr><th>Preview</th><th>Project</th><th>Category</th><th>Featured</th><th>Status</th><th>Action</th></tr></thead><tbody>'+
 data.map((x,i)=>'<tr><td>'+(x.thumbnail_url?'<img src="'+attr(x.thumbnail_url)+'" alt="" style="width:72px;height:62px;object-fit:cover;border-radius:5px">':'—')+'</td><td>'+esc(x.title)+'</td><td>'+esc(x.category||'')+'</td><td>'+(x.featured?'★ Yes':'No')+'</td><td>'+(x.published?'Live':'Draft')+'</td><td><div class="cms-row-actions"><button class="action-btn edit" data-edit="'+i+'">Edit</button><button class="action-btn danger" data-del="'+i+'">Delete</button></div></td></tr>').join('')+'</tbody></table></section>';
 document.getElementById('addProject').onclick=()=>projectForm({});
 content.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>projectForm(data[Number(b.dataset.edit)]));
 content.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeRow('projects',data[Number(b.dataset.del)].id,showProjects));
};
window.projectForm=(x={})=>{
 content.innerHTML='<div class="admin-head"><div><span>PROJECT STUDIO</span><h1>'+(x.id?'Edit project':'Add project')+'</h1></div><button class="btn light" id="projectBack">← All projects</button></div><section class="admin-section"><form id="projectEditor" class="admin-form">'+
 '<label>Project Title<input name="title" required value="'+attr(x.title)+'"></label>'+
 '<label>Category<input name="category" list="categoryChoices" required value="'+attr(x.category)+'"><datalist id="categoryChoices"></datalist></label>'+
 '<div class="row"><label>Year<input name="year" type="number" value="'+attr(x.year)+'"></label><label>Order<input name="sort_order" type="number" value="'+attr(x.sort_order||0)+'"></label></div>'+
 '<label>Project external link (optional)<input name="project_url" type="url" placeholder="https://behance.net/..." value="'+attr(x.project_url)+'"></label>'+
 '<label>Main cover image<input id="projectCoverFile" type="file" accept="image/*"></label>'+
 (x.thumbnail_url?'<div class="media-thumbs"><img src="'+attr(x.thumbnail_url)+'" alt="Current cover"></div>':'')+
 '<label>Additional gallery images (select multiple)<input id="galleryFiles" type="file" accept="image/*" multiple></label>'+
 '<div class="media-thumbs" id="galleryEditor">'+(x.gallery_urls||[]).map((u,i)=>'<label><img src="'+attr(u)+'" alt="Gallery image"><span><input type="checkbox" data-remove-gallery="'+i+'"> Remove</span></label>').join('')+'</div>'+
 '<label>Description<textarea name="description" rows="5">'+esc(x.description||'')+'</textarea></label>'+
 '<label class="check-line"><input type="checkbox" name="featured" '+(x.featured?'checked':'')+'> Featured on homepage</label>'+
 '<label class="check-line"><input type="checkbox" name="published" '+(x.published!==false?'checked':'')+'> Published</label>'+
 '<button class="btn dark" id="saveProject">Save project</button><p id="saveStatus"></p></form></section>';
 document.getElementById('projectBack').onclick=showProjects;
 db.from('portfolio_categories').select('name').order('sort_order').then(({data})=>{const list=document.getElementById('categoryChoices');if(list)list.innerHTML=(data||[]).map(y=>'<option value="'+attr(y.name)+'"></option>').join('')});
 document.getElementById('projectEditor').onsubmit=async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);const b=document.getElementById('saveProject'),st=document.getElementById('saveStatus');b.disabled=true;st.textContent='Saving…';
 try{
 const p={title:f.get('title').trim(),category:f.get('category').trim(),description:f.get('description'),project_url:f.get('project_url')||null,year:f.get('year')?Number(f.get('year')):null,sort_order:Number(f.get('sort_order')||0),featured:f.get('featured')==='on',published:f.get('published')==='on'};
 if(document.getElementById('projectCoverFile').files[0])p.thumbnail_url=await uploadImage(document.getElementById('projectCoverFile').files[0],'projects');
 const photos=(x.gallery_urls||[]).filter((_,i)=>!document.querySelector('[data-remove-gallery="'+i+'"]')?.checked);
 for(const file of [...document.getElementById('galleryFiles').files])photos.push(await uploadImage(file,'gallery'));
 p.gallery_urls=photos;
 const {error}=await(x.id?db.from('projects').update(p).eq('id',x.id):db.from('projects').insert(p));if(error)throw error;showProjects()
 }catch(err){st.textContent=err.message||'Unable to save';b.disabled=false}
 };
};
