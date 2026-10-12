
/* Brand settings and SEO enhancements for static GitHub Pages + Supabase. */
(function(){
  const root = 'https://shuria-simu.github.io/';
  const staticIcon = root + 'favicon.png';
  const inCategory = /(^|\/)category\.html$/i.test(location.pathname);
  const allowUrl = value => {
    try {const u = new URL(value, location.href);return ['https:','http:'].includes(u.protocol)?u.href:null}
    catch {return null}
  };
  function setMeta(selector,value) {const el=document.querySelector(selector);if(el&&value)el.setAttribute('content',value)}
  function renderName(name) {
    const words=String(name||'Shuria Simu').trim().split(/\s+/).filter(Boolean);
    const last=words.pop()||'Simu';
    document.querySelectorAll('[data-brand]').forEach((el)=>{
      if(el.id==='siteLogo'){
        el.replaceChildren(document.createTextNode((words.length?words.join(' ')+' ':'') ),Object.assign(document.createElement('span'),{textContent:last}));
        el.setAttribute('aria-label',name+' home');
      } else el.textContent=name;
    });
    const portrait=document.getElementById('profileImage');if(portrait)portrait.alt=name+', graphic designer';
  }
  function highlightTitle(value) {
    const heading=document.getElementById('heroTitle');
    if(!heading||!value)return;
    const cleaned=String(value).trim();
    const index=cleaned.indexOf('. ');
    if(index>0&&index<cleaned.length-3){
      const first=cleaned.slice(0,index+1);
      const last=cleaned.slice(index+2);
      const emphasized=document.createElement('em');emphasized.textContent=last;
      heading.replaceChildren(document.createTextNode(first+' '),emphasized);
    } else heading.textContent=cleaned;
  }
  function updateFavicon(value){
    const href=allowUrl(value)||staticIcon;
    const isSvg=/\.svg(?:$|[?#])/i.test(href);
    document.querySelectorAll('link[rel="icon"]').forEach((el)=>{
      el.href=href;
      el.type=isSvg?'image/svg+xml':'image/png';
      el.removeAttribute('sizes');
    });
    const touch=document.querySelector('link[rel="apple-touch-icon"]');
    if(touch&&value&&!isSvg)touch.href=href;
  }
  async function init(){
    if(typeof db==='undefined')return;
    const {data,error}=await db.from('settings').select('brand_name,hero_title,portrait_position,favicon_url,seo_title,seo_description,seo_keywords,og_image_url,profile_image').eq('id',1).maybeSingle();
    if(error||!data)return;
    if(data.brand_name){renderName(data.brand_name);setMeta('meta[property="og:site_name"]',data.brand_name)}
    if(!inCategory&&data.hero_title)highlightTitle(data.hero_title);
    if(!inCategory&&data.seo_title) {
      document.title=data.seo_title;
      setMeta('meta[property="og:title"]',data.seo_title);
      setMeta('meta[name="twitter:title"]',data.seo_title);
    }
    if(!inCategory&&data.seo_description){
      setMeta('meta[name="description"]',data.seo_description);
      setMeta('meta[property="og:description"]',data.seo_description);
      setMeta('meta[name="twitter:description"]',data.seo_description);
    }
    if(data.seo_keywords){const meta=document.querySelector('meta[name="keywords"]')||document.createElement('meta');meta.name='keywords';meta.content=data.seo_keywords;document.head.append(meta)}
    if(data.og_image_url||data.profile_image){
      const image=allowUrl(data.og_image_url)||allowUrl(data.profile_image);
      setMeta('meta[property="og:image"]',image);
      setMeta('meta[name="twitter:image"]',image);
    }
    if(data.favicon_url)updateFavicon(data.favicon_url);
    const photo=document.getElementById('profileImage');
    if(photo&&/^(?:(?:center|left|right|\d{1,3}%)(?: (?:center|top|bottom|\d{1,3}%))?)$/i.test(data.portrait_position||''))photo.style.objectPosition=data.portrait_position;
    const node=document.getElementById('seoStructuredData');
    if(node&&data.brand_name) {
      try {const graph=JSON.parse(node.textContent); graph['@graph'][0].name=data.brand_name;graph['@graph'][1].name=data.brand_name;node.textContent=JSON.stringify(graph)}
      catch(e){/* Preserve static structured data */ }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
