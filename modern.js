
/* Editorial portfolio extension. Keeps the original Supabase client and tables intact. */
const editorial={projects:[],categories:[],expanded:false,category:null};
function safeUrl(url){try{const u=new URL(url,location.href);return ['https:','http:','mailto:'].includes(u.protocol)?u.href:'#'}catch{return '#'}}
function slugify(s){return String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function linkToCategory(c){return c.link_url ? safeUrl(c.link_url) : 'category.html?category='+encodeURIComponent(c.slug||slugify(c.name))}
function projectCard(p){return '<article class="project-card"><a href="#project-'+escAttr(p.id)+'" data-project="'+escAttr(p.id)+'" aria-label="Explore '+escAttr(p.title)+'"><div class="project-image"><img loading="lazy" src="'+escAttr(p.thumbnail_url||placeholder())+'" alt="'+escAttr(p.title)+'"></div><small>'+esc(p.category||'Design')+' / '+esc(p.year||'')+'</small><h3>'+esc(p.title)+'</h3><p class="muted">'+esc(p.description||'')+'</p></a></article>'}
function projectOpen(id){const p=editorial.projects.find(x=>x.id===id);if(!p)return;const images=[p.thumbnail_url,...(p.gallery_urls||[])].filter(Boolean);let selected=0;const modal=document.createElement('div');modal.className='gallery-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.innerHTML='<div class="gallery-window"><button class="gallery-close" aria-label="Close gallery">×</button><small class="crumb">'+esc(p.category||'Design')+'</small><h2>'+esc(p.title)+'</h2><img class="gallery-primary" src="'+escAttr(images[0]||placeholder())+'" alt="'+escAttr(p.title)+'"><div class="gallery-thumbs">'+images.map((url,i)=>'<button data-image="'+i+'" class="'+(i===0?'active':'')+'" aria-label="Image '+(i+1)+'"><img src="'+escAttr(url)+'" alt=""></button>').join('')+'</div><div class="gallery-footer"><p>'+esc(p.description||'')+'</p>'+(p.project_url?'<a class="btn dark" target="_blank" rel="noopener noreferrer" href="'+escAttr(safeUrl(p.project_url))+'">Visit project ↗</a>':'')+'</div></div>';
const close=()=>{modal.remove();document.removeEventListener('keydown',onKey)};const onKey=e=>{if(e.key==='Escape')close()};modal.querySelector('.gallery-close').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close();const b=e.target.closest('[data-image]');if(b){selected=Number(b.dataset.image);modal.querySelector('.gallery-primary').src=images[selected];modal.querySelectorAll('[data-image]').forEach(x=>x.classList.toggle('active',Number(x.dataset.image)===selected))}});document.addEventListener('keydown',onKey);document.body.append(modal);modal.querySelector('.gallery-close').focus()}
document.addEventListener('click',e=>{const a=e.target.closest('[data-project]');if(a){e.preventDefault();projectOpen(a.dataset.project)}});
async function loadEditorial(){
 const [pr,cat,nav,settings,custom]=await Promise.all([
 db.from('projects').select('*').eq('published',true).order('sort_order'),
 db.from('portfolio_categories').select('*').eq('published',true).order('sort_order'),
 db.from('navigation_items').select('*').eq('published',true).order('sort_order'),
 db.from('settings').select('*').eq('id',1).maybeSingle(),
 db.from('custom_sections').select('*').eq('published',true).order('sort_order')
 ]);
 editorial.projects=pr.data||[];editorial.categories=cat.data||[];const s=settings.data||{};
 const assign=(id,value)=>{const el=document.getElementById(id);if(el&&value!=null&&value!=='')el.textContent=value};
 assign('heroKicker',s.hero_kicker);assign('aboutHeading',s.about_heading);assign('servicesHeading',s.services_heading);assign('portfolioHeading',s.portfolio_heading);assign('experienceHeading',s.experience_heading);assign('awardsHeading',s.awards_heading);assign('testimonialsHeading',s.testimonials_heading);assign('contactHeading',s.contact_heading);assign('contactIntro',s.contact_intro);assign('footerText',s.footer_text);assign('featureLabel',s.feature_label);if(/^#[0-9a-f]{6}$/i.test(s.accent_color||''))document.documentElement.style.setProperty('--rose',s.accent_color);
 if(nav.data?.length){const area=document.getElementById('siteNav');area.innerHTML=nav.data.map(n=>'<a href="'+escAttr(safeUrl(n.href))+'" class="'+(n.href==='#contact'?'nav-btn':'')+'">'+esc(n.label)+'</a>').join('')}
 if(custom.data?.length){const node=document.getElementById('customSections');node.innerHTML=custom.data.map(x=>'<section class="section '+(x.sort_order%2?'soft':'')+'"><div class="wrap custom-section"><div><span class="crumb">'+esc(x.eyebrow)+'</span><h2>'+esc(x.heading)+'</h2><p>'+esc(x.body||'')+'</p>'+(x.button_url&&x.button_label?'<a class="btn dark" rel="noopener" href="'+escAttr(safeUrl(x.button_url))+'">'+esc(x.button_label)+' ↗</a>':'')+'</div><div>'+(x.image_url?'<img loading="lazy" src="'+escAttr(x.image_url)+'" alt="'+escAttr(x.heading)+'">':'')+'</div></div></section>').join('')}
 const directory=document.getElementById('categoryDirectory');if(directory) directory.innerHTML=editorial.categories.map(c=>'<a class="category-tile" href="'+linkToCategory(c)+'"><span><strong>'+esc(c.name)+'</strong><small>'+editorial.projects.filter(p=>slugify(p.category)===slugify(c.name)).length+' projects · Explore collection</small></span><span class="arrow">↗</span></a>').join('');
 const cats=['All',...new Set(editorial.projects.map(p=>p.category).filter(Boolean).map(x=>x.trim()))];const filter=document.getElementById('filters');if(filter)filter.innerHTML=cats.map((c,i)=>'<button type="button" data-cat="'+escAttr(c)+'" class="'+(!i?'active':'')+'">'+esc(c)+'</button>').join('');
 if(filter)filter.onclick=e=>{const b=e.target.closest('[data-cat]');if(!b)return;editorial.category=b.dataset.cat;editorial.expanded=false;filter.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));paintEditorial()};
 paintEditorial();
}
function paintEditorial(){
 const rows=editorial.category&&editorial.category!=='All'?editorial.projects.filter(x=>x.category?.trim()===editorial.category):editorial.projects;
 const ordered=[...rows].sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)||((a.sort_order||0)-(b.sort_order||0)));
 const shown=editorial.expanded?ordered:ordered.slice(0,6);
 const grid=document.getElementById('portfolioGrid');if(grid)grid.innerHTML=shown.map(projectCard).join('')||'<p class="muted">New work is coming soon.</p>';
 const more=document.getElementById('showMoreProjects');if(more){more.hidden=ordered.length<=6;more.textContent=editorial.expanded?'Show less ↑':'View more work ('+(ordered.length-6)+') ↓'}
 const count=document.getElementById('projectCount');if(count)count.textContent=editorial.projects.length+'+';
}
document.getElementById('showMoreProjects')?.addEventListener('click',()=>{editorial.expanded=!editorial.expanded;paintEditorial()});
setTimeout(loadEditorial,0);
