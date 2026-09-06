/* ==========================================================================
   GDG Genesis - Cyber-Verse & KBH Showcase Interactive Logic
   ========================================================================== */

/* --- 1. HTML5 Canvas Custom Web Cursor & Physics --- */
const canvas = document.getElementById('cursorCanvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

const mouse = { x: width / 2, y: height / 2, active: false };
const history = [];
const maxHistory = 15;
const particles = [];
const webs = []; // Fired web lines

// Official Google & Spider-Man Color Palette
const googleColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#ff3838'];

function shootWebLines(clientX, clientY) {
  // Find nearest interactive anchors on screen to connect web lines
  const anchors = Array.from(document.querySelectorAll('.card-title, .section-title, .logo-genesis, .filter-btn, .motto-pill, .kbh-card-title, .stat-number'));
  const targetAnchors = anchors
    .map(node => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        dist: Math.hypot((rect.left + rect.width / 2) - clientX, (rect.top + rect.height / 2) - clientY)
      };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);

  targetAnchors.forEach(target => {
    if (target.dist < 600) {
      const randomColor = googleColors[Math.floor(Math.random() * googleColors.length)];
      webs.push({
        startX: clientX,
        startY: clientY,
        endX: target.x,
        endY: target.y,
        life: 1.0,
        color: randomColor
      });
    }
  });

  // Trigger click/tap particle burst
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(clientX, clientY, true));
  }
}

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
  
  history.push({ x: mouse.x, y: mouse.y });
  if (history.length > maxHistory) {
    history.shift();
  }

  // Web lint particles in Google Colors
  if (Math.random() < 0.25) {
    particles.push(new Particle(mouse.x, mouse.y));
  }
});

// Touch support for mobile phones
window.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
    mouse.active = true;
    if (Math.random() < 0.3) {
      particles.push(new Particle(touch.clientX, touch.clientY));
    }
  }
}, { passive: true });

// Click on desktop / Tap on mobile: Shoot web lines anchoring to nearest elements
window.addEventListener('click', (e) => {
  if (e.target.closest('.control-btn, .cta-btn, .close-btn, nav a, .filter-btn, .cyber-btn, .mobile-drawer, .modal-container')) {
    return;
  }
  shootWebLines(e.clientX, e.clientY);
});

window.addEventListener('touchstart', (e) => {
  if (e.target.closest('.control-btn, .cta-btn, .close-btn, nav a, .filter-btn, .cyber-btn, .mobile-drawer, .modal-container, video, button, a, input')) {
    return;
  }
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    shootWebLines(touch.clientX, touch.clientY);
  }
}, { passive: true });

// Particle Class
class Particle {
  constructor(x, y, isSplat = false) {
    this.x = x;
    this.y = y;
    this.radius = isSplat ? Math.random() * 2.5 + 1.2 : Math.random() * 1.5 + 0.5;
    const angle = Math.random() * Math.PI * 2;
    const speed = isSplat ? Math.random() * 3.5 + 1.5 : Math.random() * 0.8 + 0.4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1.0;
    this.decay = isSplat ? 0.045 : 0.025;
    this.color = googleColors[Math.floor(Math.random() * googleColors.length)];
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Animation loop for Web Cursor Canvas
function drawWebCursor() {
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Active Web Strings
  for (let i = webs.length - 1; i >= 0; i--) {
    const w = webs[i];
    ctx.save();
    ctx.strokeStyle = w.color;
    ctx.lineWidth = w.life * 2.2;
    ctx.globalAlpha = w.life;
    ctx.shadowBlur = 6;
    ctx.shadowColor = w.color;

    ctx.beginPath();
    ctx.moveTo(w.startX, w.startY);
    const midX = (w.startX + w.endX) / 2;
    const midY = (w.startY + w.endY) / 2 + (1.0 - w.life) * 30;
    ctx.quadraticCurveTo(midX, midY, w.endX, w.endY);
    ctx.stroke();

    // Cross spiderweb meshes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = w.life * 0.7;
    ctx.beginPath();
    for (let j = 1; j < 4; j++) {
      const ratio = j / 4;
      const ptX = w.startX + (w.endX - w.startX) * ratio;
      const ptY = w.startY + (w.endY - w.startY) * ratio + (1.0 - w.life) * 8;
      ctx.moveTo(ptX - 4, ptY - 4);
      ctx.lineTo(ptX + 4, ptY + 4);
      ctx.moveTo(ptX + 4, ptY - 4);
      ctx.lineTo(ptX - 4, ptY + 4);
    }
    ctx.stroke();
    ctx.restore();

    w.life -= 0.035;
    if (w.life <= 0) webs.splice(i, 1);
  }

  // 2. Cursor Trail Web
  if (history.length > 2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(history[0].x, history[0].y);
    for (let i = 1; i < history.length - 1; i++) {
      const xc = (history[i].x + history[i + 1].x) / 2;
      const yc = (history[i].y + history[i + 1].y) / 2;
      ctx.quadraticCurveTo(history[i].x, history[i].y, xc, yc);
    }
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // 3. Draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  // 4. Cursor Spider-Sense Crosshair
  if (mouse.active) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#38bdf8';
    
    // Outer Reticle
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Center Dot
    ctx.fillStyle = '#ff4757';
    ctx.shadowColor = '#ff4757';
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  requestAnimationFrame(drawWebCursor);
}
drawWebCursor();


/* --- 2. Category Sorting Filters --- */
const filterBtns = document.querySelectorAll('.filter-btn');
const domainCards = document.querySelectorAll('.domains-grid .domain-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const filter = btn.getAttribute('data-filter');
    
    domainCards.forEach(card => {
      const category = card.getAttribute('data-category');
      if (filter === 'all' || category === filter) {
        card.style.display = 'flex';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
        }, 50);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px) scale(0.95)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  });
});


/* --- 3. KBH Video Player Management --- */
const kbhVideo = document.getElementById('kbhVideo');
const kbhPlayPauseBtn = document.getElementById('kbhPlayPauseBtn');
const kbhMuteBtn = document.getElementById('kbhMuteBtn');
const kbhTimeCode = document.getElementById('kbhTimeCode');
const kbhEqualizer = document.getElementById('kbhEqualizer');

if (kbhVideo) {
  // Ensure video plays smoothly
  kbhVideo.play().catch(() => {});

  if (kbhPlayPauseBtn) {
    kbhPlayPauseBtn.addEventListener('click', () => {
      if (kbhVideo.paused) {
        kbhVideo.play();
        kbhPlayPauseBtn.innerText = "⏸️ Pause";
        if (kbhEqualizer) {
          const bars = kbhEqualizer.querySelectorAll('.eq-bar');
          bars.forEach(b => b.style.animationPlayState = 'running');
        }
      } else {
        kbhVideo.pause();
        kbhPlayPauseBtn.innerText = "▶️ Play";
        if (kbhEqualizer) {
          const bars = kbhEqualizer.querySelectorAll('.eq-bar');
          bars.forEach(b => b.style.animationPlayState = 'paused');
        }
      }
    });
  }

  if (kbhMuteBtn) {
    kbhMuteBtn.addEventListener('click', () => {
      if (kbhVideo.muted) {
        kbhVideo.muted = false;
        kbhMuteBtn.innerText = "🔇 Mute";
      } else {
        kbhVideo.muted = true;
        kbhMuteBtn.innerText = "🔊 Unmute";
      }
    });
  }

  // Format and update time code
  kbhVideo.addEventListener('timeupdate', () => {
    if (kbhTimeCode && kbhVideo.duration) {
      const curMins = Math.floor(kbhVideo.currentTime / 60).toString().padStart(2, '0');
      const curSecs = Math.floor(kbhVideo.currentTime % 60).toString().padStart(2, '0');
      const durMins = Math.floor(kbhVideo.duration / 60).toString().padStart(2, '0');
      const durSecs = Math.floor(kbhVideo.duration % 60).toString().padStart(2, '0');
      kbhTimeCode.innerText = `${curMins}:${curSecs} // ${durMins}:${durSecs}`;
    }
  });

  kbhVideo.addEventListener('play', () => {
    if (kbhPlayPauseBtn) kbhPlayPauseBtn.innerText = "⏸️ Pause";
    if (kbhEqualizer) {
      const bars = kbhEqualizer.querySelectorAll('.eq-bar');
      bars.forEach(b => b.style.animationPlayState = 'running');
    }
  });

  kbhVideo.addEventListener('pause', () => {
    if (kbhPlayPauseBtn) kbhPlayPauseBtn.innerText = "▶️ Play";
    if (kbhEqualizer) {
      const bars = kbhEqualizer.querySelectorAll('.eq-bar');
      bars.forEach(b => b.style.animationPlayState = 'paused');
    }
  });
}


/* --- 4. Technology Details Modal Manager --- */
const modal = document.getElementById('videoModal');
const modalTag = document.getElementById('modalTag');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalReadout = document.getElementById('modalReadout');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalPoster = document.getElementById('modalPoster');
const allInspectCards = document.querySelectorAll('.domain-card, .event-card');

const domainImages = {
  1: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  2: "aiml.jpg",
  3: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80",
  4: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80",
  5: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=600&q=80",
  6: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80",
  7: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=600&q=80",
  8: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=600&q=80",
  9: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
  10: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
};

const eventPosterSources = {
  11: "slab_poster.png",
  12: "cryptex_poster.jpg",
  13: "genesis_poster.jpg",
  14: "abyss_poster.jpg"
};

// Tech parameters database mapped by card IDs
const techParameters = {
  1: { tag: 'Welcome', title: 'Genesis Hub', desc: 'Welcome to the GDG Genesis terminal. Access technical tracks, study groups, workshops, hackathons, and community outreach networks.', command: 'INITIALIZE // CORE_SERVICES_ONLINE\nCONNECT_DOMAINS = TRUE\nDATA_SPEED = "10Gbps"\nSTATUS = "OPERATIONAL"' },
  2: { tag: 'AI/ML', title: 'AI & Machine Learning', desc: 'Building cognitive models, neural networks, predictive analytics, and natural language models using modern PyTorch frameworks and TensorFlow edge computing platforms.', command: 'LOAD MODEL: "AI_CORE_V1.h5"\nCLASSIFIERS = 4096\nLOSS_RATE = 0.012\nSTATUS = [ACTIVE]' },
  3: { tag: 'Web Dev', title: 'Web Development', desc: 'Developing reactive frontend frameworks, highly scalable backend servers, asynchronous caching, and high-performance user interfaces across the global web.', command: 'DOM_INTEGRITY = "EXCELLENT"\nENGINE = "V8_RUNTIME_STABLE"\nHTML5_CANVAS = "ENABLED"\nLOAD_TIME = 0.08s' },
  4: { tag: 'App Dev', title: 'App Development', desc: 'Building native Android solutions, cross-platform iOS modules, mobile SDK integration packages, and seamless companion app companion software.', command: 'TARGET_OS = "ANDROID_15_IOS_18"\nLATENCY = "1.2ms"\nCOMPLIANCE = "PASS"\nBATTERY_DRIP = "MINIMAL"' },
  5: { tag: 'UI/UX', title: 'UI/UX Design', desc: 'Designing user-centric wireframes, digital design systems, prototype flows, user journey maps, and interface accessibility audits.', command: 'USER_INTERFACE = "INTERACTIVE"\nBLUR_EFFECTS = "12px"\nDASHBOARD_STYLE = "GLASSMORPHIC"\nUSABILITY = 98%' },
  6: { tag: 'Blockchain', title: 'Blockchain Networks', desc: 'Structuring decentralized ledgers, smart contracts, peer-to-peer data nodes, consensus algorithms, and cryptographic data networks.', command: 'LEDGER = "GENESIS_MAIN_CHAIN"\nBLOCK_HEIGHT = 884021\nHASH = "0x89ac...33df"\nSTATUS = "SYNCHRONIZED"' },
  7: { tag: 'Media Arts', title: 'Video Editing & Media', desc: 'Constructing high-fidelity promotional media, event highlights, dynamic loops, and motion animations.', command: 'RESOLUTION = "4K_ULTRA"\nFPS = 60\nTIMELINE_SECS = 10s\nEFFECTS = ["COLOR_GRADE", "GLITCH_TRANSITION"]' },
  8: { tag: 'Marketing', title: 'Marketing & Outreach', desc: 'Publishing newsletters, organizing technical bootcamps, managing outreach campaigns, and public relations.', command: 'CHANNEL = "BROADCAST_ACTIVE"\nREACH = "NIT_HAMIRPUR_LUDHIANA"\nMETRICS = "10K_MEMBERS"\nSTATUS = "ONLINE"' },
  9: { tag: 'Hackathon', title: 'Genesis Hackathon', desc: 'A 36-hour technical hackathon sprint where student developer teams construct innovative prototype applications.', command: 'TIME_REMAINING = "36:00:00"\nREGISTRATIONS = 412\nINTEGRITY_CHECK = "PASS"\nTHREAT_ANOMALIES = 0' },
  10: { tag: 'Community', title: 'GDG Community', desc: 'A network of peer developer groups supporting collaborative tech builds, local meetups, and developer growth ecosystems.', command: 'MEMBERS = "ACTIVE"\nCHAPTER = "GDG_NITH"\nESTABLISHED = 2026\nMISSION = "GROW_TOGETHER"' },
  11: { tag: 'Hackathon', title: 'Slab Hackathon', desc: 'A developer hackathon co-hosted at NIT Hamirpur focused on constructing next-generation AI agents. Powered by the webcmd agent building tools, participant student developer teams built prototype applications and competed for a prize pool of ₹25,000.', command: 'PRIZE_POOL = "INR_25000"\nBUILD_PLATFORM = "WEBCMD_AGENT"\nHOST_INSTITUTION = "NIT_HAMIRPUR"\nSTATUS = "COMPLETED"' },
  12: { tag: 'CyberSecurity', title: 'Cryptex CTF', desc: 'A competitive Capture The Flag (CTF) security contest co-organized by GDG and Nimbus at the Mini Auditorium. Teams tackled challenging cyber security puzzles across web exploitation, cryptography, and binary reversing to win a ₹20,000 cash prize.', command: 'CTF_EVENT = "CRYPTEX_2026"\nCASH_PRIZE = "INR_20000"\nORGANIZERS = ["GDG", "NIMBUS"]\nTRACKS = ["REVERSING", "PWN", "WEB"]' },
  13: { tag: 'Induction', title: 'GDG Genesis Induction', desc: 'The official welcoming induction for new recruits to the Google Developer Groups (GDG) NIT Hamirpur Chapter, hosted at the Main Auditorium with prizes worth ₹10,000.', command: 'INDUCTION = "GENESIS_2026"\nPRIZE_POOL = "INR_10000"\nLOCATION = "AUDITORIUM"\nTIME = "02:00_PM"' },
  14: { tag: 'Creative Track', title: 'Abyss Almanac', desc: 'A premium creative design and development challenge themed around card systems and jester lore, testing participant developers on gaming logic, design frameworks, and interactive UI prototypes with prizes worth ₹70,000.', command: 'THEME = "JESTER_CARDS"\nPRIZE_WORTH = "INR_70000"\nCOMPETITION = "CREATIVE_BUILD"\nSTATUS = "COMPLETED"' }
};

let activeTypewriter = null;

function setupModalAction(id) {
  const params = techParameters[id];
  if (!params) return;
  
  if (modalPoster) {
    modalPoster.src = eventPosterSources[id] || domainImages[id] || "";
    modalPoster.alt = params.title;
  }
  
  // Assign Google tag color classes
  const tagColorClass = (id == 1 || id == 3 || id == 7 || id == 9 || id == 11 ? 'blue-tag' : (id == 5 || id == 8 || id == 10 || id == 12 ? 'red-tag' : (id == 2 || id == 14 ? 'yellow-tag' : 'green-tag')));
  modalTag.className = `card-tag ${tagColorClass}`;
  modalTag.innerText = params.tag;
  modalTitle.innerText = params.title;
  modalDesc.innerText = params.desc;
  
  // Clear any existing typing interval
  if (activeTypewriter) clearTimeout(activeTypewriter);
  
  // Typewriter readout effect
  modalReadout.innerText = "";
  let idx = 0;
  const commandText = params.command;
  
  function writeReadout() {
    if (idx < commandText.length) {
      modalReadout.innerText += commandText.charAt(idx);
      idx++;
      activeTypewriter = setTimeout(writeReadout, 15);
    }
  }
  
  modal.classList.add('active');
  activeTypewriter = setTimeout(writeReadout, 300);
}

// Attach click listeners to cards
allInspectCards.forEach(card => {
  card.addEventListener('click', () => {
    const id = card.getAttribute('data-id');
    setupModalAction(id);
  });
});

// Modal close triggers
function closeModal() {
  modal.classList.remove('active');
  if (activeTypewriter) clearTimeout(activeTypewriter);
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    closeModal();
  }
});


/* --- 5. Spider-Sense Scanner --- */
const spiderOverlay = document.getElementById('spiderSenseOverlay');
const senseBtn = document.getElementById('spiderSenseBtn');
let isSenseRunning = false;

function launchSpiderSense() {
  if (isSenseRunning) return;
  isSenseRunning = true;

  spiderOverlay.classList.add('active');

  // Vibrate & highlight all cards with Spider-Sense red alert pulse
  const allCards = document.querySelectorAll('.domain-card, .kbh-showcase-container, .clickbait-container');
  allCards.forEach(card => {
    card.style.animation = 'screenVibrate 0.12s infinite';
    card.style.borderColor = '#ea4335';
    card.style.boxShadow = '0 0 25px rgba(234, 67, 53, 0.6)';
  });

  // Revert after scan
  setTimeout(() => {
    spiderOverlay.classList.remove('active');
    allCards.forEach(card => {
      card.style.animation = '';
      card.style.borderColor = '';
      card.style.boxShadow = '';
    });
    isSenseRunning = false;
  }, 2400);
}

const mobileSenseBtn = document.getElementById('mobileSpiderSenseBtn');
if (senseBtn) {
  senseBtn.addEventListener('click', launchSpiderSense);
}
if (mobileSenseBtn) {
  mobileSenseBtn.addEventListener('click', () => {
    closeMobileDrawer();
    launchSpiderSense();
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') {
    launchSpiderSense();
  }
});


/* --- 6. Mobile Drawer Navigation Logic --- */
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileDrawer = document.getElementById('mobileDrawer');
const mobileDrawerClose = document.getElementById('mobileDrawerClose');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

function openMobileDrawer() {
  if (mobileDrawer) {
    mobileDrawer.classList.add('open');
    if (mobileMenuBtn) mobileMenuBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileDrawer() {
  if (mobileDrawer) {
    mobileDrawer.classList.remove('open');
    if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
    document.body.style.overflow = '';
  }
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    if (mobileDrawer && mobileDrawer.classList.contains('open')) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  });
}

if (mobileDrawerClose) {
  mobileDrawerClose.addEventListener('click', closeMobileDrawer);
}

mobileNavLinks.forEach(link => {
  link.addEventListener('click', () => {
    closeMobileDrawer();
    mobileNavLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// Close mobile drawer on outside click
document.addEventListener('click', (e) => {
  if (mobileDrawer && mobileDrawer.classList.contains('open')) {
    if (!mobileDrawer.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      closeMobileDrawer();
    }
  }
});


/* --- 7. Sticky Navigation Active Link Highlighter --- */
const mainSections = document.querySelectorAll('main > section');
const navLinks = document.querySelectorAll('.nav-menu a');

window.addEventListener('scroll', () => {
  let activeSection = "";
  mainSections.forEach(sec => {
    const secTop = sec.offsetTop;
    if (window.pageYOffset >= (secTop - 180)) {
      activeSection = sec.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${activeSection}`) {
      link.classList.add('active');
    }
  });

  mobileNavLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${activeSection}`) {
      link.classList.add('active');
    }
  });
});
