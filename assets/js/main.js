// assets/js/main.js
const IMAGES = [
  'assets/images/photo1.jpg',
  'assets/images/photo2.jpg',
  'assets/images/photo3.jpg',
  'assets/images/photo4.jpg',
  'assets/images/photo5.jpg'
];

// Utility: preload
function preloadImages(list){ return new Promise(resolve=>{
  imagesLoaded(list.map(src=>{
    const img = new Image(); img.src = src; return img;
  }), resolve);
});}

// Build slides
function buildSlides(wrapper, images){
  wrapper.innerHTML = '';
  images.forEach((src, i)=>{
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    const img = document.createElement('img');
    img.className = 'slide-img';
    img.dataset.src = src;
    img.alt = `Photo ${i+1}`;
    img.loading = 'lazy';
    slide.appendChild(img);
    wrapper.appendChild(slide);
  });
}

// Initialize Swiper with default params
let swiper;
function initSwiper(params = {}){
  if(swiper) swiper.destroy(true,true);
  swiper = new Swiper('.mySwiper', Object.assign({
    loop:true,
    speed:900,
    slidesPerView:1,
    spaceBetween:10,
    pagination:{el:'.swiper-pagination',clickable:true},
    navigation:{nextEl:'.swiper-button-next',prevEl:'.swiper-button-prev'}
  }, params));
}

// Effect handlers
const Effects = {
  fade(){ initSwiper({effect:'fade',fadeEffect:{crossFade:true}}); },
  slide(){ initSwiper({effect:'slide'}); },
  cube(){ initSwiper({effect:'cube',cubeEffect:{shadow:true,slideShadows:true}}); },
  kenburns(){
    initSwiper({autoplay:{delay:6000,disableOnInteraction:false}});
    // add class to images to animate scale
    document.querySelectorAll('.slide-img').forEach(img=>{
      img.classList.add('kb-zoom');
      img.style.transform = 'scale(1.08)';
      // animate with GSAP for smoother control
      gsap.fromTo(img,{scale:1.05},{scale:1.12,duration:12,repeat:-1,yoyo:true,ease:'sine.inOut'});
    });
  },
  glitch(){
    initSwiper({autoplay:{delay:3500}});
    document.querySelectorAll('.swiper-slide').forEach(s=>{
      s.classList.add('glitch');
    });
  },
  mosaic(){
    // create mosaic overlay per slide
    document.querySelectorAll('.swiper-slide').forEach((s,idx)=>{
      s.innerHTML = '';
      const grid = document.createElement('div'); grid.className='mosaic-grid';
      for(let i=0;i<32;i++){
        const cell = document.createElement('div'); cell.className='mosaic-cell';
        cell.style.backgroundImage = `url(${IMAGES[idx % IMAGES.length]})`;
        grid.appendChild(cell);
      }
      s.appendChild(grid);
      // reveal cells staggered
      const cells = grid.querySelectorAll('.mosaic-cell');
      cells.forEach((c,i)=> setTimeout(()=>{ c.style.opacity=1; c.style.transform='scale(1)'; }, 30*i));
    });
    initSwiper({autoplay:{delay:4000}});
  },
  particles(){
    // show canvas and run a simple Three.js particle effect that morphs into image
    document.getElementById('glCanvas').style.display='block';
    document.querySelector('.mySwiper').style.display='none';
    runThreeParticles(IMAGES);
  },
  shader(){
    // placeholder: use Three.js shader pass to transition images (detailed shader code can be added)
    document.getElementById('glCanvas').style.display='block';
    document.querySelector('.mySwiper').style.display='none';
    runShaderDemo(IMAGES);
  },
  parallax(){
    initSwiper({parallax:true,autoplay:{delay:4500}});
    // add data-swiper-parallax attributes
    document.querySelectorAll('.slide-img').forEach((img,i)=>{
      img.setAttribute('data-swiper-parallax', (i%2?'-200':'200'));
    });
  },
  auto(){
    // cycle through effects every 12s
    const list = ['fade','slide','kenburns','parallax','cube','glitch','mosaic'];
    let idx=0;
    Effects[list[idx]]();
    setInterval(()=>{
      idx = (idx+1)%list.length;
      // reset DOM to default slides
      document.getElementById('glCanvas').style.display='none';
      document.querySelector('.mySwiper').style.display='block';
      buildSlides(document.getElementById('slidesWrapper'), IMAGES);
      preloadImages(IMAGES).then(()=> Effects[list[idx]]());
    }, 12000);
  }
};

// Minimal Three.js particle demo (simplified)
function runThreeParticles(images){
  // Basic scene, camera, renderer
  const canvas = document.getElementById('glCanvas');
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true});
  renderer.setSize(window.innerWidth, window.innerHeight*0.7);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth/(window.innerHeight*0.7), 0.1, 1000);
  camera.position.z = 100;

  // create particles that sample texture (omitted heavy sampling for brevity)
  const geometry = new THREE.BufferGeometry();
  const count = 8000;
  const positions = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    positions[i*3+0] = (Math.random()-0.5)*200;
    positions[i*3+1] = (Math.random()-0.5)*120;
    positions[i*3+2] = (Math.random()-0.5)*50;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const material = new THREE.PointsMaterial({color:0xffffff,size:1.2});
  const points = new THREE.Points(geometry,material);
  scene.add(points);

  function animate(){ requestAnimationFrame(animate); points.rotation.y += 0.001; renderer.render(scene,camera); }
  animate();
}

// Placeholder shader demo
function runShaderDemo(images){
  const canvas = document.getElementById('glCanvas');
  canvas.style.display='block';
  // For full shader transitions, integrate a shader pass (e.g., using glsl) — left as extension.
}

// Init
document.addEventListener('DOMContentLoaded', async ()=>{
  const wrapper = document.getElementById('slidesWrapper');
  buildSlides(wrapper, IMAGES);
  await preloadImages(IMAGES);
  initSwiper();
  // wire effect select
  const sel = document.getElementById('effectSelect');
  sel.addEventListener('change', e=>{
    // reset DOM
    document.getElementById('glCanvas').style.display='none';
    document.querySelector('.mySwiper').style.display='block';
    buildSlides(wrapper, IMAGES);
    // small delay to ensure DOM updated
    setTimeout(()=> Effects[e.target.value](), 50);
  });
});
