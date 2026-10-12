
/* Interaction layer for Shuria's new visual portfolio. No database writes. */
(()=>{
const menu=document.getElementById('menuToggle');
const nav=document.getElementById('siteNav');
if(menu&&nav){
 const close=()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('wow-nav-open')};
 menu.addEventListener('click',()=>{const opened=nav.classList.toggle('wow-nav-open');menu.setAttribute('aria-expanded',String(opened))});
 nav.addEventListener('click',e=>{if(e.target.closest('a'))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 document.addEventListener('click',e=>{if(!menu.contains(e.target)&&!nav.contains(e.target))close()});
 window.addEventListener('resize',()=>{if(innerWidth>700)close()},{passive:true});
}
const photo=document.getElementById('profileImage');
const art=document.querySelector('.wow-art-side');
if(photo&&art){
 const check=()=>{if(photo.complete&&photo.naturalWidth>0)art.classList.add('has-photo')};
 photo.addEventListener('load',check);
 photo.addEventListener('error',()=>art.classList.remove('has-photo'));
 new MutationObserver(check).observe(photo,{attributes:true,attributeFilter:['src','style']});
 check();
}
const email=document.getElementById('contactEmail');
const emailLink=document.getElementById('contactEmailLink');
if(email&&emailLink){
 const update=()=>{
   const value=email.textContent.trim();
   if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))emailLink.href='mailto:'+value;
 };
 new MutationObserver(update).observe(email,{childList:true,characterData:true,subtree:true});
 update();
}
// A section without published content should not leave a large empty gap.
const sectionContents=[
 ['serviceGrid','services'],['experienceList','experience'],['awardGrid','awards'],['testimonialGrid','testimonials']
];
function handleEmptySections(){
 sectionContents.forEach(([id,sectionId])=>{
  const section=document.getElementById(sectionId),target=document.getElementById(id);
  if(!section||!target)return;
  if(sectionId==='experience'){
    section.hidden=target.children.length===0&&document.getElementById('educationList')?.children.length===0;
  }else section.hidden=target.children.length===0;
 });
}
sectionContents.forEach(([id])=>{
 const target=document.getElementById(id);
 if(target)new MutationObserver(handleEmptySections).observe(target,{childList:true});
});
const education=document.getElementById('educationList');
if(education)new MutationObserver(handleEmptySections).observe(education,{childList:true});
window.addEventListener('load',()=>setTimeout(handleEmptySections,1600),{once:true});
// Subtle scroll entrances: bypass motion for users who prefer less movement.
const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
if(!reduce&&'IntersectionObserver' in window){
 const nodes=[...document.querySelectorAll('.wow-section-head,.wow-about-title,.wow-about-info,.wow-contact-copy,.wow-contact-form,.wow-collections-head')];
 nodes.forEach(x=>x.setAttribute('data-reveal',''));
 const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('wow-revealed');io.unobserve(e.target)}},{threshold:.12,rootMargin:'0px 0px -15px 0px'});
 nodes.forEach(x=>io.observe(x));
}
})();
