(() => {
 const $=(s)=>document.querySelector(s);
 const grid=$('#gameGrid'), cards=[...document.querySelectorAll('.game-card')], search=$('#gameSearch'), empty=$('#emptyState');
 let category='all';
 function filter(){const q=(search?.value||'').trim().toLowerCase();let visible=0;cards.forEach(card=>{const ok=(category==='all'||card.dataset.category===category)&&(card.dataset.name+' '+card.innerText).toLowerCase().includes(q);card.hidden=!ok;if(ok)visible++;});empty.hidden=visible!==0;}
 document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');category=btn.dataset.filter;filter();}));
 search?.addEventListener('input',filter);
 $('#year').textContent=new Date().getFullYear();
 const network=()=>{const online=navigator.onLine;$('#networkText').textContent=online?'Online':'Offline';$('.network-pill').classList.toggle('offline',!online);};
 addEventListener('online',network);addEventListener('offline',network);network();
 $('#themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('desiplay-theme',document.body.classList.contains('light')?'light':'dark');});
 if(localStorage.getItem('desiplay-theme')==='light')document.body.classList.add('light');
 const menu=$('#menuBtn'), nav=$('.nav-links');
 function setMenuOpen(open){nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');}
 menu.addEventListener('click',()=>setMenuOpen(!nav.classList.contains('open')));
 document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>setMenuOpen(false)));
 $('#continueBtn').addEventListener('click',()=>{const last=localStorage.getItem('desiplay-last-game');location.href=last||'./games/tic-tac-toe.html';});
 document.querySelectorAll('.game-card a').forEach(a=>a.addEventListener('click',()=>localStorage.setItem('desiplay-last-game',a.href)));
 let installPrompt=null;const install=$('#installBtn');
 addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;install.hidden=false;});
 install.addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;install.hidden=true;});
 if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();