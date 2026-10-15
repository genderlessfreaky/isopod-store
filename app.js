'use strict';
const categories={isopode:'art','brain-jar':'candles','tooth-candle':'candles','cerebro-pote':'objects','prancha-anatomica':'art','reliquia-isopod':'objects'};
const categoryNames={art:'ARTE & GRAVURAS',candles:'VELAS ESCULTÓRICAS',objects:'OBJETOS CURIOSOS'};
const $=s=>document.querySelector(s);
const money=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let filter='all',selected=null,toastTimer,bagBounceTimers=[],productPageScrollX=0,productPageScrollY=0;
let cart={};
try{const saved=JSON.parse(localStorage.getItem('isopod-cart')||'{}');if(saved&&typeof saved==='object')Object.keys(PRODUCTS).forEach(id=>{if(Number.isInteger(saved[id])&&saved[id]>0)cart[id]=Math.min(saved[id],99)})}catch{}
function notify(message){if($('#productDialog').open){$('#purchaseStatus').textContent=message;return}$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600)}
function persist(){try{localStorage.setItem('isopod-cart',JSON.stringify(cart))}catch{notify('Sua sacola ficará salva apenas nesta visita.')}renderCart();renderPurchase()}
function renderProducts(){let list=Object.entries(PRODUCTS).filter(([id,p])=>(filter==='all'||categories[id]===filter)&&normalize(p.name+' '+p.desc+' '+p.materials).includes(normalize($('#search').value.trim())));const sort=$('#sort').value;if(sort==='price-asc')list.sort((a,b)=>a[1].price-b[1].price);if(sort==='price-desc')list.sort((a,b)=>b[1].price-a[1].price);if(sort==='name')list.sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt-BR'));$('#productsGrid').innerHTML=list.map(([id,p])=>`<article class="product-card"><div class="product-art"><button class="product-art-link" data-product="${id}" aria-label="Conhecer ${p.name}"><img src="assets/${id}.svg" alt="Ilustração de ${p.name}" loading="lazy" width="340" height="340"></button><span class="product-badge">${p.meta.toUpperCase()}</span><span class="product-no">Fig. ${String(Object.keys(PRODUCTS).indexOf(id)+1).padStart(3,'0')}</span><button class="quick-add" data-add="${id}" aria-label="Adicionar ${p.name} à sacola">+</button></div><div class="product-info"><span class="product-category">${categoryNames[categories[id]]}</span><div class="product-name-row"><button class="product-name" data-product="${id}">${p.name}</button><span class="product-price">${money(p.price)}</span></div><p>${p.desc}</p></div></article>`).join('');$('#resultCount').textContent=`${list.length} produto${list.length===1?' encontrado':'s encontrados'}`;$('#emptyResults').hidden=!!list.length}
function add(id){if(!PRODUCTS[id])return;if((cart[id]||0)>=99){notify('Limite de 99 unidades por peça.');return}cart[id]=(cart[id]||0)+1;window.isopodSounds.play('add');$('#orderSuccess').hidden=true;persist();if($('#productDialog').open&&selected===id){$('#purchaseStatus').textContent='Adicionado à sacola. ✓'}else notify(`${PRODUCTS[id].name} na sacola. ✦`)}
function openProduct(id){if(!PRODUCTS[id])return;window.isopodSounds.play('product');selected=id;const p=PRODUCTS[id];$('#detailName').textContent=p.name;$('#detailMeta').textContent=categoryNames[categories[id]]+' / '+p.meta;$('#detailDesc').textContent=p.desc;$('#detailPrice').textContent=money(p.price);$('#detailDimensions').textContent=p.dimensions;$('#detailArt').innerHTML=`<img src="assets/${id}.svg" alt="Ilustração de ${p.name}">`;setTab('materials');$('#purchaseStatus').textContent='na sua sacola';renderPurchase();$('#toast').classList.remove('visible');productPageScrollX=window.scrollX;productPageScrollY=window.scrollY;const dialog=$('#productDialog'),detail=dialog.querySelector('.product-detail');dialog.scrollTop=0;detail.scrollTop=0;dialog.appendChild($('#cartOpen'));dialog.showModal();requestAnimationFrame(()=>{dialog.scrollTop=0;detail.scrollTop=0})}
function renderPurchase(){
 if(!selected)return;
 const quantity=cart[selected]||0;
 const addButton=$('#addToCart'),stepper=$('#detailQuantity');
 const previous=Number(stepper.dataset.quantity||0);
 const changed=stepper.dataset.product===selected&&previous!==quantity;
 const restoreAddFocus=quantity===0&&stepper.contains(document.activeElement);
 addButton.hidden=quantity>0;stepper.hidden=quantity===0;
 $('#detailQuantityValue').textContent=quantity;
 $('#detailPlus').disabled=quantity>=99;
 $('#detailMinus').setAttribute('aria-label','Remover uma unidade de '+PRODUCTS[selected].name);
 $('#detailPlus').setAttribute('aria-label','Adicionar uma unidade de '+PRODUCTS[selected].name);
 stepper.dataset.product=selected;stepper.dataset.quantity=quantity;
 if(restoreAddFocus)addButton.focus({preventScroll:true});
 if(changed&&$('#productDialog').open)animatePurchase(previous,quantity);
}
function animatePurchase(previous,quantity){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const surface=quantity?$('#detailQuantity'):$('#addToCart');
 const value=$('#detailQuantityValue');
 [surface,value].forEach(element=>element.getAnimations().forEach(animation=>animation.cancel()));
 if(!previous||!quantity){
  surface.animate([{opacity:.35,transform:'translateY(5px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});
 }else{
  const offset=quantity>previous?9:-9;
  value.animate([{opacity:.3,transform:`translateY(${offset}px) scale(.86)`},{opacity:1,transform:'translateY(0) scale(1.1)',offset:.65},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 if(quantity)surface.animate([{backgroundColor:'#81524a',borderColor:'#c29b80'},{backgroundColor:'#663b38',borderColor:'#91635b'}],{duration:460,easing:'ease-out'});
}
function changeDetailQuantity(delta){
 if(!selected)return;
 const quantity=cart[selected]||0;
 if(delta>0){add(selected);if(cart[selected]===99)$('#purchaseStatus').textContent='Limite de 99 unidades por peça.';else $('#purchaseStatus').textContent='Quantidade atualizada. ✓';return}
 if(quantity<=1)delete cart[selected];else cart[selected]=quantity-1;
 window.isopodSounds.play('remove');
 persist();$('#purchaseStatus').textContent=cart[selected]?'Quantidade atualizada. ✓':'Peça removida da sacola.';
}
function setTab(tab){$('#tabPanel').textContent=PRODUCTS[selected][tab];document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1});$('#tabPanel').setAttribute('aria-labelledby','tab-'+tab)}
function renderCart(){const ids=Object.keys(cart);const count=ids.reduce((sum,id)=>sum+cart[id],0);const badge=$('#cartCount');const previous=badge.dataset.count===undefined?count:Number(badge.dataset.count);badge.textContent=count;badge.dataset.count=count;if(count!==previous)animateBag(count>previous?'up':'down');$('#cartOpen').setAttribute('aria-label',`Abrir sacola, ${$('#cartCount').textContent} itens`);$('#cartItems').innerHTML=ids.length?ids.map(id=>`<div class="cart-item"><img src="assets/${id}.svg" alt=""><div><h3>${PRODUCTS[id].name}</h3><p>${money(PRODUCTS[id].price)}</p><div class="qty"><button data-minus="${id}" aria-label="Diminuir quantidade de ${PRODUCTS[id].name}">−</button><span aria-label="Quantidade">${cart[id]}</span><button data-plus="${id}" aria-label="Aumentar quantidade de ${PRODUCTS[id].name}">+</button></div></div><button class="remove-item" data-remove="${id}" aria-label="Remover ${PRODUCTS[id].name}">×</button></div>`).join(''):`<div class="empty-cart"><span>✦</span><h3>Sua próxima curiosidade espera.</h3><p>A sacola está vazia por enquanto.<br>Encontre algo que desperte seu lado estranho.</p><button class="button dark" data-close="cartDialog">Explorar a coleção ↗</button></div>`;$('#cartTotal').textContent=money(ids.reduce((sum,id)=>sum+PRODUCTS[id].price*cart[id],0));$('#cartSummary').hidden=!ids.length||!$('#orderSuccess').hidden}
function animateBag(direction='up'){
 const bag=$('#cartOpen'),badge=$('#cartCount');
 const steps=direction==='up'?
  [
   [4,'scale(1.08,.92)','rotate(0deg)',120],
   [-26,'scale(.96,1.06)','rotate(-7deg)',190],
   [0,'scale(1.04,.96)','rotate(4deg)',150],
   [-6,'scale(.99,1.02)','rotate(-2deg)',130],
   [0,'scale(1)','rotate(0deg)',170]
  ]:
  [
   [-3,'scale(.96,1.04)','rotate(-3deg)',130],
   [24,'scale(1.05,.92)','rotate(7deg)',230],
   [4,'scale(.95,1.04)','rotate(-4deg)',190],
   [0,'scale(1.02,.98)','rotate(2deg)',150],
   [0,'scale(1)','rotate(0deg)',170]
  ];
 bagBounceTimers.forEach(clearTimeout);bagBounceTimers=[];
 bag.style.setProperty('transition','none','important');
 badge.style.setProperty('transition','none','important');
 bag.style.setProperty('transform','translateY(0) scale(1)','important');
 badge.style.setProperty('transform','scale(1)','important');
 void bag.offsetHeight;
 requestAnimationFrame(()=>{
  const move=(element,transition,value)=>{
   element.style.setProperty('transition',transition,'important');
   element.style.setProperty('transform',value,'important');
  };
  let elapsed=0;
  for(const [offset,scale,rotate,duration] of steps){
   const wait=elapsed;
   bagBounceTimers.push(setTimeout(()=>move(bag,`transform ${duration}ms cubic-bezier(.2,.75,.25,1)`,`translateY(${offset}px) ${scale} ${rotate}`),wait));
   elapsed+=duration;
  }
  move(badge,'transform 120ms cubic-bezier(.2,.75,.25,1)','scale(1.32)');
  bagBounceTimers.push(setTimeout(()=>move(badge,'transform 150ms ease-out','scale(1)'),230));
  bagBounceTimers.push(setTimeout(()=>{bag.style.removeProperty('transform');bag.style.removeProperty('transition');badge.style.removeProperty('transform');badge.style.removeProperty('transition');bagBounceTimers=[]},elapsed+30));
 });
}

function restoreBag(){if($('#cartOpen').parentElement===$('#productDialog'))document.body.appendChild($('#cartOpen'))}
$('#productDialog').addEventListener('close',()=>{restoreBag();requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(productPageScrollX,productPageScrollY)))});
function openCart(){window.isopodSounds.play('bag');restoreBag();if($('#productDialog').open)$('#productDialog').close();renderCart();$('#cartDialog').showModal()}

function showSearch(){$('.search-panel').hidden=false;$('#colecao').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});setTimeout(()=>$('#search').focus({preventScroll:true}),300)}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-detail-minus')){changeDetailQuantity(-1);return}if(b.hasAttribute('data-detail-plus')){changeDetailQuantity(1);return}if(b.dataset.sort){window.isopodSounds.play('select');$('#sort').value=b.dataset.sort;$('#sortValue').textContent=b.querySelector('strong').textContent;document.querySelectorAll('.sort-option').forEach(option=>option.setAttribute('aria-selected',String(option===b)));b.closest('.sort-picker').open=false;renderProducts();$('.sort-trigger').focus({preventScroll:true});return}if(b.dataset.product)openProduct(b.dataset.product);if(b.dataset.add)add(b.dataset.add);if(b.dataset.close){window.isopodSounds.play('close');$('#'+b.dataset.close).close()}if(b.dataset.filter){window.isopodSounds.play('select');filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',active)});renderProducts()}if(b.dataset.tab){window.isopodSounds.play('select');setTab(b.dataset.tab)}if(b.dataset.minus||b.dataset.plus||b.dataset.remove){const id=b.dataset.minus||b.dataset.plus||b.dataset.remove;if(b.dataset.remove){delete cart[id];window.isopodSounds.play('remove')}else if(b.dataset.minus){cart[id]--;window.isopodSounds.play('remove');if(!cart[id])delete cart[id]}else{cart[id]=Math.min(99,cart[id]+1);if(cart[id]>0)window.isopodSounds.play('add')}persist()}});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
document.querySelectorAll('[data-tab]').forEach((b,i)=>{b.id='tab-'+b.dataset.tab;b.addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-tab]')];let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();setTab(tabs[next].dataset.tab);tabs[next].focus()}})});
$('#cartOpen').onclick=openCart;$('#addToCart').onclick=()=>{add(selected);if(cart[selected])$('#detailPlus').focus({preventScroll:true})};$('.search-toggle').onclick=showSearch;$('#searchOpen').onclick=showSearch;$('#search').addEventListener('input',renderProducts);$('#clearSearch').onclick=()=>{$('#search').value='';renderProducts();$('#search').focus()};$('#resetFilters').onclick=()=>{$('#search').value='';$('[data-filter="all"]').click()};$('#checkoutBtn').onclick=()=>{if(!Object.keys(cart).length)return;window.isopodSounds.play('success');cart={};$('#orderSuccess').hidden=false;persist();$('#cartItems').innerHTML='';$('#cartDialog').scrollTo({top:0,behavior:'smooth'})};$('#year').textContent=new Date().getFullYear();renderProducts();renderCart();



document.addEventListener('click',event=>{const picker=$('.sort-picker');if(picker?.open&&!picker.contains(event.target))picker.open=false});
