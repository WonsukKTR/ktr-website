// mobile menu toggle (shared across pages)
(function(){
  var b=document.getElementById('burger'),m=document.getElementById('mmenu');
  if(!b||!m)return;
  b.addEventListener('click',function(){m.classList.toggle('open');});
  m.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click',function(){m.classList.remove('open');});
  });
})();

// hero auto slider (index page only; rolls continuously every 3s)
(function(){
  var slider=document.getElementById('heroSlider');
  if(!slider)return;
  var slides=slider.querySelectorAll('.hero-slide');
  var dots=document.querySelectorAll('#heroDots .dot');
  if(slides.length<2)return;
  var i=0,timer=null,DELAY=3000;
  function show(n){
    i=(n+slides.length)%slides.length;
    slides.forEach(function(s,idx){s.classList.toggle('is-active',idx===i);});
    dots.forEach(function(d,idx){d.classList.toggle('is-active',idx===i);});
  }
  function start(){
    if(timer)clearInterval(timer);
    timer=setInterval(function(){show(i+1);},DELAY);
  }
  // manual dot navigation restarts the timer (keeps rolling afterwards)
  dots.forEach(function(d,idx){
    d.addEventListener('click',function(){show(idx);start();});
  });
  start(); // continuous auto-roll, no pause
})();

// scroll reveal + number count-up (fires as content enters the viewport)
(function(){
  var supports='IntersectionObserver' in window;

  // 1) reveal-on-scroll
  var els=document.querySelectorAll('.reveal');
  if(els.length){
    if(!supports){
      els.forEach(function(e){e.classList.add('in');});
    }else{
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}
        });
      },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
      els.forEach(function(e){io.observe(e);});
    }
  }

  // 2) count-up numbers ([data-count] on an element whose first text node is the number)
  var nums=document.querySelectorAll('[data-count]');
  if(nums.length){
    function run(el){
      var target=parseInt(el.getAttribute('data-count'),10);
      var node=el.firstChild;
      if(isNaN(target)||!node||node.nodeType!==3)return;
      var dur=1300,t0=null;
      function step(ts){
        if(!t0)t0=ts;
        var p=Math.min((ts-t0)/dur,1);
        var eased=1-Math.pow(1-p,3); // easeOutCubic
        node.textContent=Math.floor(eased*target);
        if(p<1){requestAnimationFrame(step);}else{node.textContent=target;}
      }
      requestAnimationFrame(step);
    }
    if(!supports){
      nums.forEach(run);
    }else{
      var io2=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(en.isIntersecting){run(en.target);io2.unobserve(en.target);}
        });
      },{threshold:.6});
      nums.forEach(function(n){io2.observe(n);});
    }
  }
})();

// live exchange rates in the header — rotates USD/JPY/CNY/VND/CAD/EUR every 3s
(function(){
  var inner=document.getElementById('fxInner');
  var pairEl=document.getElementById('fxPair');
  var valEl=document.getElementById('fxVal');
  var chip=document.getElementById('fx');
  if(!valEl||!pairEl)return;

  // KRW value per (unit) foreign currency; label shows the currency unit only
  // order: 미국 · 일본 · 유럽 · 영국 · 캐나다 · 중국 · 베트남 · 태국
  var LIST=[
    {code:'USD',label:'USD',     unit:1,   dec:1},
    {code:'JPY',label:'JPY 100', unit:100, dec:1},
    {code:'EUR',label:'EUR',     unit:1,   dec:1},
    {code:'GBP',label:'GBP',     unit:1,   dec:1},
    {code:'CAD',label:'CAD',     unit:1,   dec:1},
    {code:'CNY',label:'CNY',     unit:1,   dec:1},
    {code:'VND',label:'VND 100', unit:100, dec:2},
    {code:'THB',label:'THB',     unit:1,   dec:1}
  ];
  var rates=null, idx=0, rot=null;

  function krw(c){
    if(!rates||!rates[c.code]||!rates.KRW)return null;
    return (rates.KRW/rates[c.code])*c.unit; // rates are per-USD, so KRW/X = KRW per 1 X
  }
  function render(){
    var c=LIST[idx], v=krw(c);
    pairEl.textContent=c.label;
    valEl.textContent = (v==null) ? '—'
      : '₩'+v.toLocaleString('ko-KR',{minimumFractionDigits:c.dec,maximumFractionDigits:c.dec});
  }
  function rotate(){
    if(!inner){idx=(idx+1)%LIST.length;render();return;}
    inner.classList.add('swap');
    setTimeout(function(){
      idx=(idx+1)%LIST.length;
      render();
      inner.classList.remove('swap');
    },350);
  }
  function startRotate(){ if(rot)clearInterval(rot); rot=setInterval(rotate,3000); }

  function load(){
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function(r){return r.json();})
      .then(function(d){
        if(!d||!d.rates)throw new Error('no rates');
        rates=d.rates; render();
        if(chip&&d.time_last_update_utc){
          chip.setAttribute('title','실시간 환율 (KRW 기준)\n기준: '+d.time_last_update_utc);
        }
      })
      .catch(function(){ if(!rates)valEl.textContent='—'; });
  }

  render();       // initial placeholder
  load();         // fetch rates
  startRotate();  // begin 3s rotation
  setInterval(load,60000); // refresh underlying rates each minute
})();
