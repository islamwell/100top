/**
 * 100Top Islam & Quran (2026 Edition) - Master Application Engine (v1.0.2)
 * Interactive Search, Quran Audio Player, Deep-Dive Modals, Flashcards,
 * Top 20 Reservations Explorer, Reflective Journaling & Comprehensive Button Handlers.
 */

(function() {
  'use strict';

  // State Management
  const state = {
    activeTab: 'concepts',
    selectedCategory: 'all',
    searchQuery: '',
    viewMode: 'grid', // 'grid' | 'list'
    onlyBookmarks: false,
    bookmarks: JSON.parse(localStorage.getItem('100top_bookmarks') || '[]'),
    journalNotes: JSON.parse(localStorage.getItem('100top_journal') || '{}'),
    activeFlashcardIndex: 0,
    shuffledFlashcards: [],
    theme: localStorage.getItem('100top_theme') || 'emerald',
    
    // Audio Player State
    audio: new Audio(),
    currentVerse: null,
    isPlaying: false,
    autoPlayNext: false,
    playbackRate: 1.0,
    quoteIndex: 0
  };

  // DOM Cache
  const dom = {
    // Canvas
    canvas: document.getElementById('canvas-bg'),
    
    // Nav & Tabs
    navTabs: document.querySelectorAll('.nav-tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    themeToggle: document.getElementById('theme-toggle-btn'),
    footerLinks: document.querySelectorAll('.footer-tab-link'),
    statChips: document.querySelectorAll('.stat-chip[data-target-tab]'),
    
    // Search & Filter
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    categoriesContainer: document.getElementById('categories-container'),
    viewGridBtn: document.getElementById('view-grid-btn'),
    viewListBtn: document.getElementById('view-list-btn'),
    filterBookmarksBtn: document.getElementById('filter-bookmarks-btn'),
    resultsCount: document.getElementById('results-count'),
    
    // Cards Container
    cardsContainer: document.getElementById('cards-container'),
    emptyState: document.getElementById('empty-state'),
    
    // Reservations
    reservationsContainer: document.getElementById('reservations-container'),
    reservationSearch: document.getElementById('reservation-search'),
    
    // Questions & Journal
    questionsContainer: document.getElementById('questions-container'),
    exportJournalBtn: document.getElementById('export-journal-btn'),
    
        // Flashcards Studio
    flashcardWrapper: document.getElementById('flashcard-wrapper'),
    flashcardFront: document.getElementById('flashcard-front'),
    flashcardBack: document.getElementById('flashcard-back'),
    flashcardCurrentNum: document.getElementById('flashcard-current-num'),
    flashcardTotalNum: document.getElementById('flashcard-total-num'),
    flashcardMasteredCount: document.getElementById('flashcard-mastered-count'),
    flashcardProgressBar: document.getElementById('flashcard-progress-bar'),
    flashCategorySelect: document.getElementById('flash-category-select'),
    btnMarkMastered: document.getElementById('btn-mark-mastered'),
    flashPrevBtn: document.getElementById('flash-prev-btn'),
    flashNextBtn: document.getElementById('flash-next-btn'),
    flashFlipBtn: document.getElementById('flash-flip-btn'),
    flashShuffleBtn: document.getElementById('flash-shuffle-btn'),
    
    // Quotes Carousel
    quoteBox: document.getElementById('quote-carousel-box'),
    quotePrevBtn: document.getElementById('quote-prev-btn'),
    quoteNextBtn: document.getElementById('quote-next-btn'),
    
    // Modal
    modalOverlay: document.getElementById('modal-overlay'),
    modalContent: document.getElementById('modal-content'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    
    // Global Audio Player
    audioPlayerBar: document.getElementById('audio-player-bar'),
    audioSurahName: document.getElementById('audio-surah-name'),
    audioVerseRef: document.getElementById('audio-verse-ref'),
    audioArabicSnippet: document.getElementById('audio-arabic-snippet'),
    audioPlayBtn: document.getElementById('audio-play-btn'),
    audioPrevBtn: document.getElementById('audio-prev-btn'),
    audioNextBtn: document.getElementById('audio-next-btn'),
    audioSeekBar: document.getElementById('audio-seek-bar'),
    audioCurrentTime: document.getElementById('audio-current-time'),
    audioDuration: document.getElementById('audio-duration'),
    audioSpeedSelect: document.getElementById('audio-speed-select'),
    audioAutoToggle: document.getElementById('audio-auto-toggle'),
    audioCloseBtn: document.getElementById('audio-close-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function init() {
    applyTheme(state.theme);
    initCanvas();
    renderCategories();
    renderCards();
    renderReservations();
    renderQuestions();
    initFlashcards();
    renderQuote();
    initAudioEngine();
    bindEvents();
    checkUrlHash();
  }

    // =========================================================================
  // TAB SWITCHER & SMOOTH SECTION SCROLLING
  // =========================================================================
  function scrollToSection(targetTab) {
    let targetElement = null;
    if (targetTab === 'concepts') {
      targetElement = document.querySelector('.search-filter-section') || document.getElementById('tab-concepts');
    } else {
      targetElement = document.getElementById(`tab-${targetTab}`);
    }

    if (targetElement) {
      const navbar = document.querySelector('.navbar');
      const navbarHeight = navbar ? navbar.offsetHeight : 70;
      const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navbarHeight - 15;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  }

  function switchTab(targetTab, shouldScroll = true) {
    if (!targetTab) return;
    
    // Update nav tab buttons
    dom.navTabs.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab panes
    dom.tabPanes.forEach(pane => {
      if (pane.id === `tab-${targetTab}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    state.activeTab = targetTab;
    if (targetTab === 'flashcards') {
      renderCurrentFlashcard();
    }
    
    if (shouldScroll) {
      // Defer scroll to next frame to ensure pane display:block is active
      setTimeout(() => {
        scrollToSection(targetTab);
      }, 50);
    }
  }

  function checkUrlHash() {
    const hash = window.location.hash.replace('#', '').replace('tab-', '');
    if (['concepts', 'reservations', 'questions', 'flashcards'].includes(hash)) {
      switchTab(hash, true);
    }
  }

  // =========================================================================
  // THEME MANAGEMENT
  // =========================================================================
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('100top_theme', theme);
    
    if (dom.themeToggle) {
      const icon = dom.themeToggle.querySelector('i') || dom.themeToggle;
      if (theme === 'midnight') {
        icon.className = 'fas fa-moon';
        dom.themeToggle.setAttribute('title', 'Theme: Midnight OLED (Click to switch)');
      } else if (theme === 'light') {
        icon.className = 'fas fa-sun';
        dom.themeToggle.setAttribute('title', 'Theme: Light Sand (Click to switch)');
      } else {
        icon.className = 'fas fa-gem';
        dom.themeToggle.setAttribute('title', 'Theme: Emerald Luxury (Click to switch)');
      }
    }
  }

  function cycleTheme() {
    if (state.theme === 'emerald') applyTheme('midnight');
    else if (state.theme === 'midnight') applyTheme('light');
    else applyTheme('emerald');
    showToast(`Switched to ${state.theme.toUpperCase()} theme`);
  }

  // =========================================================================
  // CANVAS SACRED GEOMETRY PARTICLES
  // =========================================================================
  function initCanvas() {
    if (!dom.canvas) return;
    const ctx = dom.canvas.getContext('2d');
    let width = dom.canvas.width = window.innerWidth;
    let height = dom.canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = dom.canvas.width = window.innerWidth;
      height = dom.canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(55, Math.floor(width / 30));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.4 ? 'rgba(212, 175, 55, ' : 'rgba(16, 185, 129, '
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '0.6)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color + (1 - dist / 140) * 0.15 + ')';
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  // =========================================================================
  // CATEGORIES & FILTERING
  // =========================================================================
  function renderCategories() {
    if (!dom.categoriesContainer || !window.APP_DATA) return;
    
    dom.categoriesContainer.innerHTML = window.APP_DATA.categories.map(cat => {
      const isActive = state.selectedCategory === cat.id;
      return `
        <button class="category-chip ${isActive ? 'active' : ''}" data-cat="${cat.id}">
          <span>${cat.name}</span>
          <span class="chip-count">${cat.count}</span>
        </button>
      `;
    }).join('');
  }

  function getFilteredItems() {
    if (!window.APP_DATA || !window.APP_DATA.items) return [];
    
    return window.APP_DATA.items.filter(item => {
      // Category Filter
      if (state.selectedCategory !== 'all') {
        const catObj = window.APP_DATA.categories.find(c => c.id === state.selectedCategory);
        if (catObj && item.category !== catObj.name) {
          return false;
        }
      }

      // Bookmarks Filter
      if (state.onlyBookmarks && !state.bookmarks.includes(item.id)) {
        return false;
      }

      // Search Query
      if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inArabic = item.arabic.includes(q);
        const inRoot = item.root.toLowerCase().includes(q);
        const inSummary = item.summary.toLowerCase().includes(q);
        const inCategory = item.category.toLowerCase().includes(q);
        const inTags = item.tags.some(t => t.toLowerCase().includes(q));
        const inVerse = item.verse.textEnglish.toLowerCase().includes(q) || item.verse.surahName.toLowerCase().includes(q);

        return inTitle || inArabic || inRoot || inSummary || inCategory || inTags || inVerse;
      }

      return true;
    });
  }

  // =========================================================================
  // CARDS RENDERING (GRID & LIST)
  // =========================================================================
  function renderCards() {
    if (!dom.cardsContainer) return;

    const items = getFilteredItems();

    if (dom.resultsCount) {
      if (state.onlyBookmarks) {
        dom.resultsCount.textContent = `${items.length} Bookmarked Dimensions`;
      } else {
        dom.resultsCount.textContent = `${items.length} of 200 Dimensions`;
      }
    }

    if (items.length === 0) {
      dom.cardsContainer.style.display = 'none';
      if (dom.emptyState) dom.emptyState.style.display = 'block';
      return;
    }

    dom.cardsContainer.style.display = state.viewMode === 'list' ? 'flex' : 'grid';
    dom.cardsContainer.className = state.viewMode === 'list' ? 'cards-list' : 'cards-grid';
    if (dom.emptyState) dom.emptyState.style.display = 'none';

    dom.cardsContainer.innerHTML = items.map(item => {
      const isBookmarked = state.bookmarks.includes(item.id);
      const isCurrentlyPlaying = state.currentVerse && state.currentVerse.itemId === item.id && state.isPlaying;

      return `
        <div class="concept-card" data-id="${item.id}">
          <div class="card-header-top">
            <span class="card-id-badge">#${String(item.id).padStart(3, '0')}</span>
            <span class="card-category-tag">${item.category.split('&')[0].trim()}</span>
          </div>

          <div class="card-arabic-heading font-arabic">${item.arabic}</div>
          <h3 class="card-english-title">${item.title}</h3>
          <div class="card-root-box">${item.root}</div>

          <p class="card-summary">${item.summary}</p>

          <div class="card-verse-box">
            <div class="card-verse-header">
              <span class="card-verse-ref">Surah ${item.verse.surahName} (${item.verse.surah}:${item.verse.ayah})</span>
              <button class="btn-play-verse ${isCurrentlyPlaying ? 'playing' : ''}" data-item-id="${item.id}" title="Listen to recitation">
                <i class="fas ${isCurrentlyPlaying ? 'fa-pause' : 'fa-play'}"></i>
                <span>${isCurrentlyPlaying ? 'Pause' : 'Recite'}</span>
              </button>
            </div>
            <div class="card-verse-arabic font-arabic">${item.verse.textArabic}</div>
            <div class="card-verse-english">"${item.verse.textEnglish}"</div>
          </div>

          <div class="card-footer">
            <button class="btn-card-details" data-id="${item.id}">
              <span>Deep Reflection</span>
              <i class="fas fa-arrow-right"></i>
            </button>
            <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-id="${item.id}" title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark this Dimension'}">
              <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // DEEP DIVE MODAL
  // =========================================================================
  function openModal(itemId) {
    if (!window.APP_DATA) return;
    const item = window.APP_DATA.items.find(i => i.id === Number(itemId));
    if (!item || !dom.modalOverlay || !dom.modalContent) return;

    const isBookmarked = state.bookmarks.includes(item.id);
    const isCurrentlyPlaying = state.currentVerse && state.currentVerse.itemId === item.id && state.isPlaying;

    dom.modalContent.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="card-id-badge" style="font-size: 0.9rem; padding: 0.3rem 0.8rem;">Dimension #${String(item.id).padStart(3, '0')}</span>
          <span class="card-category-tag" style="font-size: 0.85rem;">${item.category}</span>
        </div>
        <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-id="${item.id}" style="font-size: 1.3rem;">
          <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
        </button>
      </div>

      <div style="text-align: right; margin-bottom: 1rem;">
        <h1 class="font-arabic" style="font-size: 2.5rem; color: var(--text-arabic); line-height: 1.3;">${item.arabic}</h1>
      </div>

      <h2 style="font-family: var(--font-display); font-size: 1.85rem; font-weight: 800; margin-bottom: 0.5rem;">${item.title}</h2>
      
      <div class="card-root-box" style="font-size: 0.9rem; margin-bottom: 1.5rem; display: inline-block;">
        <strong>Linguistic Root:</strong> ${item.root}
      </div>

      <div style="background: rgba(0, 0, 0, 0.25); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid var(--border-subtle);">
        <h4 style="color: var(--accent-gold-bright); font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Core Conceptual Overview</h4>
        <p style="color: var(--text-primary); font-size: 1rem; line-height: 1.7;">${item.summary}</p>
      </div>

      <div style="background: linear-gradient(135deg, rgba(6, 20, 18, 0.8), rgba(12, 38, 34, 0.8)); border: 1px solid var(--border-gold); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.75rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <span style="font-weight: 800; color: var(--accent-gold-bright); font-size: 0.95rem;">
            <i class="fas fa-book-quran" style="margin-right: 0.4rem;"></i> Surah ${item.verse.surahName} (${item.verse.surah}:${item.verse.ayah})
          </span>
          <button class="btn-play-verse ${isCurrentlyPlaying ? 'playing' : ''}" data-item-id="${item.id}" style="padding: 0.4rem 1rem; font-size: 0.85rem;">
            <i class="fas ${isCurrentlyPlaying ? 'fa-pause' : 'fa-play'}"></i>
            <span>${isCurrentlyPlaying ? 'Pause Audio' : 'Play Recitation'}</span>
          </button>
        </div>
        <div class="font-arabic" style="font-size: 1.6rem; color: var(--text-arabic); line-height: 1.8; margin-bottom: 0.85rem;">${item.verse.textArabic}</div>
        <div style="color: var(--text-secondary); font-size: 0.95rem; font-style: italic; line-height: 1.6;">"${item.verse.textEnglish}"</div>
      </div>

      <div style="margin-bottom: 1.75rem;">
        <h4 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-feather text-gold"></i> Deep Dive & Encyclopedic Significance
        </h4>
        <p style="color: var(--text-secondary); font-size: 0.98rem; line-height: 1.8;">${item.deepDive}</p>
      </div>

      <div style="background: rgba(212, 175, 55, 0.08); border-left: 3px solid var(--accent-gold-bright); border-radius: var(--radius-sm); padding: 1.25rem; margin-bottom: 1.75rem;">
        <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--accent-gold-bright); margin-bottom: 0.35rem; letter-spacing: 0.05em;">Linguistic & Thematic Gem</div>
        <div style="font-size: 1.05rem; font-style: italic; color: #fff; line-height: 1.6; margin-bottom: 0.5rem;">"${item.quote}"</div>
        <button class="btn-copy-quote" data-quote="${item.quote.replace(/"/g, '&quot;')}" style="background: transparent; border: 1px solid var(--border-gold); color: var(--accent-gold-bright); font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: var(--radius-full); cursor: pointer;">
          <i class="fas fa-copy"></i> Copy Wisdom Gem
        </button>
      </div>

      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--accent-emerald-bright); margin-bottom: 0.35rem; letter-spacing: 0.05em;">2026 Daily Practical Application</div>
        <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;">${item.practicalTakeaway}</div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        ${item.tags.map(tag => `<span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 0.2rem 0.6rem; border-radius: var(--radius-full); color: var(--text-muted);">#${tag}</span>`).join('')}
      </div>
    `;

    dom.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!dom.modalOverlay) return;
    dom.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // =========================================================================
  // TOP 20 RESERVATIONS EXPLORER
  // =========================================================================
  function renderReservations() {
    if (!dom.reservationsContainer || !window.APP_DATA) return;

    let reservations = window.APP_DATA.reservations;
    const query = dom.reservationSearch ? dom.reservationSearch.value.trim().toLowerCase() : '';

    if (query) {
      reservations = reservations.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.reservation.toLowerCase().includes(query) ||
        r.counterArgument.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );
    }

    dom.reservationsContainer.innerHTML = reservations.map((res) => {
      return `
        <div class="reservation-card" data-id="${res.id}">
          <div class="reservation-header" data-id="${res.id}">
            <div class="reservation-title-group">
              <div class="reservation-num">${res.id}</div>
              <div>
                <div style="font-size: 0.75rem; color: var(--accent-emerald-bright); font-weight: 700; text-transform: uppercase; margin-bottom: 0.2rem;">${res.category}</div>
                <h3 class="reservation-question">${res.title}</h3>
              </div>
            </div>
            <div class="reservation-toggle-icon"><i class="fas fa-chevron-down"></i></div>
          </div>

          <div class="reservation-body">
            <div class="reservation-objection-box">
              <strong>The Common Reservation / Objection:</strong>
              <div style="margin-top: 0.35rem;">"${res.reservation}"</div>
            </div>

            <div class="reservation-counter-text">${res.counterArgument}</div>

            <div class="card-verse-box" style="margin-bottom: 1.25rem;">
              <div class="card-verse-header">
                <span class="card-verse-ref">Quranic Evidence: Surah ${res.verse.surahName} (${res.verse.surah}:${res.verse.ayah})</span>
                <button class="btn-play-verse" data-audio="${res.verse.audioUrl}" data-surah="${res.verse.surahName}" data-ref="${res.verse.surah}:${res.verse.ayah}" data-arabic="${res.verse.textArabic.replace(/"/g, '&quot;')}">
                  <i class="fas fa-play"></i> Recite Ayah
                </button>
              </div>
              <div class="card-verse-arabic font-arabic">${res.verse.textArabic}</div>
              <div class="card-verse-english">"${res.verse.textEnglish}"</div>
            </div>

            <div class="reservation-takeaway-banner">
              <i class="fas fa-shield-halved text-gold" style="font-size: 1.25rem;"></i>
              <div><strong>Key Rational Insight:</strong> ${res.keyTakeaway}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // REFLECTIVE INQUIRIES & PERSONAL JOURNAL
  // =========================================================================
  function renderQuestions() {
    if (!dom.questionsContainer || !window.APP_DATA) return;

    dom.questionsContainer.innerHTML = window.APP_DATA.questions.map((q, index) => {
      const savedNote = state.journalNotes[q.id] || '';

      return `
        <div class="question-card" data-qid="${q.id}">
          <div>
            <div style="font-size: 0.75rem; color: var(--accent-emerald-bright); font-weight: 700; text-transform: uppercase; margin-bottom: 0.35rem;">Inquiry #${index + 1} • ${q.category}</div>
            <h3 class="question-title">${q.title}</h3>
            <p class="question-text">"${q.question}"</p>
            <p class="question-context">${q.context}</p>

            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-gold-bright); margin-bottom: 0.4rem;">Guided Self-Introspection:</div>
              <ul class="question-prompts-list">
                ${q.reflectionPrompts.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </div>

            <div class="card-verse-box" style="margin-bottom: 1rem;">
              <div class="card-verse-header">
                <span class="card-verse-ref">Surah ${q.verse.surahName} (${q.verse.surah}:${q.verse.ayah})</span>
                <button class="btn-play-verse" data-audio="${q.verse.audioUrl}" data-surah="${q.verse.surahName}" data-ref="${q.verse.surah}:${q.verse.ayah}" data-arabic="${q.verse.textArabic.replace(/"/g, '&quot;')}">
                  <i class="fas fa-play"></i> Recite
                </button>
              </div>
              <div class="card-verse-arabic font-arabic" style="font-size: 1.1rem;">${q.verse.textArabic}</div>
            </div>
          </div>

          <div>
            <textarea class="journal-textarea" data-qid="${q.id}" placeholder="Write your private confidential reflections here... (auto-saved locally)">${savedNote}</textarea>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <button class="journal-save-btn" data-qid="${q.id}">
                <i class="fas fa-save"></i> Save Reflection
              </button>
              <span class="save-indicator" data-qid="${q.id}" style="font-size: 0.75rem; color: var(--accent-emerald-bright); display: none;">Saved!</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function saveJournalNote(qid, text) {
    state.journalNotes[qid] = text;
    localStorage.setItem('100top_journal', JSON.stringify(state.journalNotes));
    const indicator = document.querySelector(`.save-indicator[data-qid="${qid}"]`);
    if (indicator) {
      indicator.style.display = 'inline';
      setTimeout(() => { indicator.style.display = 'none'; }, 2000);
    }
  }

  function exportJournal() {
    if (!window.APP_DATA) return;
    let exportText = `# 100Top Islam & Quran - My Personal Reflection Journal\n`;
    exportText += `Exported on: ${new Date().toLocaleString()}\n\n`;

    window.APP_DATA.questions.forEach((q, i) => {
      const note = state.journalNotes[q.id] || 'No notes written yet.';
      exportText += `## ${i + 1}. ${q.title}\n`;
      exportText += `**Question:** ${q.question}\n\n`;
      exportText += `**My Reflections:**\n${note}\n\n---\n\n`;
    });

    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Islam_Quran_Reflection_Journal_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Reflection Journal exported successfully!');
  }

    // =========================================================================
  // FLASHCARDS STUDY ENGINE (ADVANCED)
  // =========================================================================
  state.flashcardCategory = 'all';
  state.masteredCards = JSON.parse(localStorage.getItem('100top_mastered_cards') || '[]');
  state.flashcardDeck = [];

  function initFlashcards() {
    if (!window.APP_DATA || !window.APP_DATA.items) return;
    updateFlashcardDeck();
  }

  function updateFlashcardDeck() {
    if (!window.APP_DATA || !window.APP_DATA.items) return;
    
    if (state.flashcardCategory === 'all') {
      state.flashcardDeck = [...window.APP_DATA.items];
    } else {
      state.flashcardDeck = window.APP_DATA.items.filter(i => i.category === state.flashcardCategory);
    }

    state.activeFlashcardIndex = 0;
    renderCurrentFlashcard();
  }

  function renderCurrentFlashcard() {
    if (!dom.flashcardWrapper || state.flashcardDeck.length === 0) return;
    const item = state.flashcardDeck[state.activeFlashcardIndex];
    if (!item) return;

    // Reset rotation state to front
    dom.flashcardWrapper.classList.remove('flipped');

    const total = state.flashcardDeck.length;
    const current = state.activeFlashcardIndex + 1;
    const isMastered = state.masteredCards.includes(item.id);

    // Update numbers and progress bar
    if (dom.flashcardCurrentNum) dom.flashcardCurrentNum.textContent = current;
    if (dom.flashcardTotalNum) dom.flashcardTotalNum.textContent = total;
    if (dom.flashcardProgressBar) {
      dom.flashcardProgressBar.style.width = `${(current / total) * 100}%`;
    }
    if (dom.flashcardMasteredCount) {
      dom.flashcardMasteredCount.textContent = `• ${state.masteredCards.length} Mastered`;
    }

    // Update Mastered Button State
    if (dom.btnMarkMastered) {
      if (isMastered) {
        dom.btnMarkMastered.classList.add('mastered');
        dom.btnMarkMastered.innerHTML = '<i class="fas fa-check-double"></i> Mastered';
      } else {
        dom.btnMarkMastered.classList.remove('mastered');
        dom.btnMarkMastered.innerHTML = '<i class="fas fa-check"></i> Mark Mastered';
      }
    }

    const isCurrentlyPlaying = state.currentVerse && state.currentVerse.itemId === item.id && state.isPlaying;

    // Front Side (Question / Arabic Calligraphy & Root)
    dom.flashcardFront.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <span class="card-id-badge" style="font-size: 0.85rem;">Card #${String(item.id).padStart(3, '0')}</span>
        <span class="card-category-tag" style="font-size: 0.8rem;">${item.category}</span>
        ${isMastered ? '<span style="font-size: 0.75rem; color: var(--accent-emerald-bright); font-weight: 800; background: rgba(16,185,129,0.15); padding: 0.2rem 0.6rem; border-radius: var(--radius-full);"><i class="fas fa-check"></i> Mastered</span>' : ''}
      </div>

      <div style="text-align: center; margin: auto 0; padding: 1.5rem 0;">
        <div style="font-size: 0.85rem; color: var(--accent-gold-bright); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
          What is the meaning and Quranic significance of:
        </div>
        <div class="font-arabic" style="font-size: 3.2rem; color: var(--text-arabic); line-height: 1.3; margin-bottom: 1rem;">
          ${item.arabic}
        </div>
        <div class="card-root-box" style="font-size: 1.05rem; padding: 0.4rem 1rem;">
          Linguistic Root: <strong>${item.root}</strong>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 0.5rem;">
        <button class="btn-play-verse ${isCurrentlyPlaying ? 'playing' : ''}" data-item-id="${item.id}" title="Recite verse audio" style="padding: 0.4rem 0.9rem;">
          <i class="fas ${isCurrentlyPlaying ? 'fa-pause' : 'fa-play'}"></i> <span>Recite Ayah</span>
        </button>

        <div style="color: var(--text-muted); font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
          <i class="fas fa-hand-pointer text-gold"></i> Click card or press Space to Flip
        </div>
      </div>
    `;

    // Back Side (Answer / English Title, Meaning, Verse & Practical Takeaway)
    dom.flashcardBack.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <span class="card-id-badge" style="background: rgba(16,185,129,0.15); color: var(--accent-emerald-bright); font-size: 0.85rem;">
          <i class="fas fa-lightbulb"></i> Answer & Reflection
        </span>
        <span class="card-category-tag" style="font-size: 0.8rem;">${item.category}</span>
      </div>

      <div style="margin: auto 0; padding: 0.75rem 0;">
        <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
          <h3 style="font-family: var(--font-display); font-size: 1.45rem; font-weight: 800; color: #fff;">${item.title}</h3>
          <span class="font-arabic" style="font-size: 1.3rem; color: var(--accent-gold-bright);">${item.arabic}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.92rem; line-height: 1.6; margin-bottom: 0.85rem;">${item.summary}</p>
        
        <div class="card-verse-box" style="padding: 0.75rem 1rem; margin-bottom: 0.85rem;">
          <div class="card-verse-header" style="margin-bottom: 0.35rem;">
            <span class="card-verse-ref" style="font-size: 0.75rem;">Surah ${item.verse.surahName} (${item.verse.surah}:${item.verse.ayah})</span>
            <button class="btn-play-verse ${isCurrentlyPlaying ? 'playing' : ''}" data-item-id="${item.id}" style="padding: 0.2rem 0.6rem; font-size: 0.7rem;">
              <i class="fas ${isCurrentlyPlaying ? 'fa-pause' : 'fa-play'}"></i> <span>Recite</span>
            </button>
          </div>
          <div class="card-verse-arabic font-arabic" style="font-size: 1.05rem; line-height: 1.5;">${item.verse.textArabic}</div>
          <div class="card-verse-english" style="font-size: 0.78rem;">"${item.verse.textEnglish}"</div>
        </div>

        <div style="font-size: 0.85rem; color: var(--accent-emerald-bright); line-height: 1.5; background: rgba(16,185,129,0.08); padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); border-left: 2px solid var(--accent-emerald);">
          <strong>2026 Action:</strong> ${item.practicalTakeaway}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
        <span style="font-size: 0.75rem; color: var(--text-muted);">Root: ${item.root}</span>
        <span style="color: var(--accent-gold-bright); font-size: 0.85rem; font-weight: 700; cursor: pointer;">
          Click to Flip Back <i class="fas fa-rotate" style="margin-left: 0.25rem;"></i>
        </span>
      </div>
    `;
  }

  function toggleFlashcardFlip() {
    if (!dom.flashcardWrapper) return;
    dom.flashcardWrapper.classList.toggle('flipped');
  }

  function nextFlashcard() {
    if (state.flashcardDeck.length === 0) return;
    if (state.activeFlashcardIndex < state.flashcardDeck.length - 1) {
      state.activeFlashcardIndex++;
    } else {
      state.activeFlashcardIndex = 0;
      showToast('Completed deck! Restarting from Card 1.');
    }
    renderCurrentFlashcard();
  }

  function prevFlashcard() {
    if (state.flashcardDeck.length === 0) return;
    if (state.activeFlashcardIndex > 0) {
      state.activeFlashcardIndex--;
    } else {
      state.activeFlashcardIndex = state.flashcardDeck.length - 1;
    }
    renderCurrentFlashcard();
  }

  function shuffleFlashcards() {
    for (let i = state.flashcardDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.flashcardDeck[i], state.flashcardDeck[j]] = [state.flashcardDeck[j], state.flashcardDeck[i]];
    }
    state.activeFlashcardIndex = 0;
    renderCurrentFlashcard();
    showToast(`Shuffled ${state.flashcardDeck.length} flashcards!`);
  }

  function toggleMasteryCurrentCard() {
    if (state.flashcardDeck.length === 0) return;
    const item = state.flashcardDeck[state.activeFlashcardIndex];
    if (!item) return;

    const idx = state.masteredCards.indexOf(item.id);
    if (idx === -1) {
      state.masteredCards.push(item.id);
      showToast(`Marked Dimension #${item.id} as Mastered! 🎉`);
    } else {
      state.masteredCards.splice(idx, 1);
      showToast(`Unmarked Dimension #${item.id} from Mastered.`);
    }

    localStorage.setItem('100top_mastered_cards', JSON.stringify(state.masteredCards));
    renderCurrentFlashcard();
  }

  // =========================================================================
  // QUOTES CAROUSEL
  // =========================================================================
  function renderQuote() {
    if (!dom.quoteBox || !window.APP_DATA || !window.APP_DATA.quotes) return;
    const q = window.APP_DATA.quotes[state.quoteIndex];
    if (!q) return;

    dom.quoteBox.innerHTML = `
      <div class="quote-theme">${q.theme}</div>
      <div class="quote-body">"${q.quote}"</div>
      <div class="quote-source">— ${q.source}</div>
    `;
  }

  function nextQuote() {
    if (!window.APP_DATA || !window.APP_DATA.quotes) return;
    state.quoteIndex = (state.quoteIndex + 1) % window.APP_DATA.quotes.length;
    renderQuote();
  }

  function prevQuote() {
    if (!window.APP_DATA || !window.APP_DATA.quotes) return;
    state.quoteIndex = (state.quoteIndex - 1 + window.APP_DATA.quotes.length) % window.APP_DATA.quotes.length;
    renderQuote();
  }

  // =========================================================================
  // QURAN AUDIO ENGINE
  // =========================================================================
  function initAudioEngine() {
    state.audio.addEventListener('timeupdate', () => {
      if (dom.audioSeekBar && state.audio.duration) {
        dom.audioSeekBar.value = (state.audio.currentTime / state.audio.duration) * 100;
        if (dom.audioCurrentTime) dom.audioCurrentTime.textContent = formatTime(state.audio.currentTime);
        if (dom.audioDuration) dom.audioDuration.textContent = formatTime(state.audio.duration);
      }
    });

    state.audio.addEventListener('ended', () => {
      state.isPlaying = false;
      updateAudioUI();
      if (state.autoPlayNext) {
        playNextTrack();
      }
    });

    state.audio.addEventListener('play', () => {
      state.isPlaying = true;
      updateAudioUI();
    });

    state.audio.addEventListener('pause', () => {
      state.isPlaying = false;
      updateAudioUI();
    });
  }

  function playVerse(verseData) {
    state.currentVerse = verseData;
    state.audio.src = verseData.audioUrl;
    state.audio.playbackRate = state.playbackRate;
    const playPromise = state.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Audio playback error / user interaction required:', err);
      });
    }

    if (dom.audioPlayerBar) {
      dom.audioPlayerBar.classList.remove('minimized');
    }

    if (dom.audioSurahName) dom.audioSurahName.textContent = `Surah ${verseData.surahName}`;
    if (dom.audioVerseRef) dom.audioVerseRef.textContent = `Verse (${verseData.surah}:${verseData.ayah}) • Sheikh Mishary Alafasy`;
    if (dom.audioArabicSnippet) dom.audioArabicSnippet.textContent = verseData.textArabic;

    updateAudioUI();
  }

  function togglePlayPause() {
    if (!state.currentVerse) {
      // Play first item if none active
      if (window.APP_DATA && window.APP_DATA.items.length > 0) {
        const first = window.APP_DATA.items[0];
        playVerse({
          itemId: first.id,
          surah: first.verse.surah,
          ayah: first.verse.ayah,
          surahName: first.verse.surahName,
          textArabic: first.verse.textArabic,
          audioUrl: first.verse.audioUrl
        });
      }
      return;
    }

    if (state.isPlaying) {
      state.audio.pause();
    } else {
      state.audio.play().catch(err => console.warn('Audio play error:', err));
    }
  }

  function playNextTrack() {
    if (!window.APP_DATA || !window.APP_DATA.items.length) return;
    let currentIndex = 0;
    if (state.currentVerse && typeof state.currentVerse.itemId === 'number') {
      const idx = window.APP_DATA.items.findIndex(i => i.id === state.currentVerse.itemId);
      if (idx !== -1) currentIndex = idx + 1;
    }
    if (currentIndex >= window.APP_DATA.items.length) currentIndex = 0;

    const nextItem = window.APP_DATA.items[currentIndex];
    playVerse({
      itemId: nextItem.id,
      surah: nextItem.verse.surah,
      ayah: nextItem.verse.ayah,
      surahName: nextItem.verse.surahName,
      textArabic: nextItem.verse.textArabic,
      audioUrl: nextItem.verse.audioUrl
    });
  }

  function playPrevTrack() {
    if (!window.APP_DATA || !window.APP_DATA.items.length) return;
    let currentIndex = 0;
    if (state.currentVerse && typeof state.currentVerse.itemId === 'number') {
      const idx = window.APP_DATA.items.findIndex(i => i.id === state.currentVerse.itemId);
      if (idx > 0) currentIndex = idx - 1;
      else currentIndex = window.APP_DATA.items.length - 1;
    }

    const prevItem = window.APP_DATA.items[currentIndex];
    playVerse({
      itemId: prevItem.id,
      surah: prevItem.verse.surah,
      ayah: prevItem.verse.ayah,
      surahName: prevItem.verse.surahName,
      textArabic: prevItem.verse.textArabic,
      audioUrl: prevItem.verse.audioUrl
    });
  }

  function updateAudioUI() {
    if (dom.audioPlayBtn) {
      dom.audioPlayBtn.innerHTML = state.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    // Re-render play button states on cards
    document.querySelectorAll('.btn-play-verse').forEach(btn => {
      const itemId = Number(btn.getAttribute('data-item-id'));
      if (state.currentVerse && state.currentVerse.itemId === itemId && state.isPlaying) {
        btn.classList.add('playing');
        btn.innerHTML = '<i class="fas fa-pause"></i> <span>Pause</span>';
      } else {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fas fa-play"></i> <span>Recite</span>';
      }
    });
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message) {
    if (!dom.toastContainer) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 300; display: flex; flex-direction: column; gap: 0.5rem;';
      document.body.appendChild(container);
      dom.toastContainer = container;
    }

    const toast = document.createElement('div');
    toast.style.cssText = 'background: rgba(10, 33, 30, 0.95); border: 1px solid var(--border-gold); color: #fff; padding: 0.75rem 1.25rem; border-radius: var(--radius-md); font-size: 0.9rem; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.5); backdrop-filter: blur(12px); animation: fadeIn 200ms ease;';
    toast.innerHTML = `<i class="fas fa-check-circle text-gold" style="margin-right: 0.5rem;"></i> ${message}`;

    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 300ms ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // =========================================================================
  // BOOKMARK MANAGEMENT
  // =========================================================================
  function toggleBookmark(itemId) {
    const id = Number(itemId);
    const index = state.bookmarks.indexOf(id);
    if (index === -1) {
      state.bookmarks.push(id);
      showToast(`Added Dimension #${id} to Bookmarks`);
    } else {
      state.bookmarks.splice(index, 1);
      showToast(`Removed Dimension #${id} from Bookmarks`);
    }
    localStorage.setItem('100top_bookmarks', JSON.stringify(state.bookmarks));
    renderCards();
  }

  // =========================================================================
  // COPY CLIPBOARD HELPER (WITH FALLBACK)
  // =========================================================================
  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Wisdom Gem copied to clipboard!');
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Wisdom Gem copied to clipboard!');
    } catch (err) {
      showToast('Could not copy to clipboard');
    }
    document.body.removeChild(textArea);
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================
  function bindEvents() {
    // Navigation Tabs
    dom.navTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });

    // Brand Logo Click (Scroll to Top)
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo) {
      brandLogo.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('concepts', false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    });

    // Footer Navigation Links
    dom.footerLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = link.getAttribute('data-tab');
        switchTab(targetTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Hero Stat Chips (Clickable shortcuts)
    dom.statChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const targetTab = chip.getAttribute('data-target-tab');
        if (targetTab === 'audio') {
          togglePlayPause();
        } else if (targetTab) {
          switchTab(targetTab);
        }
      });
    });

    // Theme Toggle
    if (dom.themeToggle) {
      dom.themeToggle.addEventListener('click', cycleTheme);
    }

    // Search Input
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (dom.searchClearBtn) {
          dom.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
        }
        renderCards();
      });
    }

    if (dom.searchClearBtn) {
      dom.searchClearBtn.addEventListener('click', () => {
        dom.searchInput.value = '';
        state.searchQuery = '';
        dom.searchClearBtn.style.display = 'none';
        renderCards();
      });
    }

    // Categories
    if (dom.categoriesContainer) {
      dom.categoriesContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;
        state.selectedCategory = chip.getAttribute('data-cat');
        state.onlyBookmarks = false;
        if (dom.filterBookmarksBtn) dom.filterBookmarksBtn.classList.remove('active');

        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (state.activeTab !== 'concepts') {
          switchTab('concepts', false);
        }
        renderCards();
        scrollToSection('concepts');
      });
    }

    // View Toggles
    if (dom.viewGridBtn) {
      dom.viewGridBtn.addEventListener('click', () => {
        state.viewMode = 'grid';
        dom.viewGridBtn.classList.add('active');
        if (dom.viewListBtn) dom.viewListBtn.classList.remove('active');
        renderCards();
      });
    }

    if (dom.viewListBtn) {
      dom.viewListBtn.addEventListener('click', () => {
        state.viewMode = 'list';
        dom.viewListBtn.classList.add('active');
        if (dom.viewGridBtn) dom.viewGridBtn.classList.remove('active');
        renderCards();
      });
    }

    // Bookmarks Filter
    if (dom.filterBookmarksBtn) {
      dom.filterBookmarksBtn.addEventListener('click', () => {
        state.onlyBookmarks = !state.onlyBookmarks;
        dom.filterBookmarksBtn.classList.toggle('active', state.onlyBookmarks);
        renderCards();
      });
    }

    // Delegated Card Click (Details, Play, Bookmark)
    if (dom.cardsContainer) {
      dom.cardsContainer.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.btn-play-verse');
        if (playBtn) {
          e.stopPropagation();
          const itemId = Number(playBtn.getAttribute('data-item-id'));
          const item = window.APP_DATA.items.find(i => i.id === itemId);
          if (item) {
            if (state.currentVerse && state.currentVerse.itemId === itemId && state.isPlaying) {
              state.audio.pause();
            } else {
              playVerse({
                itemId: item.id,
                surah: item.verse.surah,
                ayah: item.verse.ayah,
                surahName: item.verse.surahName,
                textArabic: item.verse.textArabic,
                audioUrl: item.verse.audioUrl
              });
            }
          }
          return;
        }

        const bookmarkBtn = e.target.closest('.btn-bookmark');
        if (bookmarkBtn) {
          e.stopPropagation();
          toggleBookmark(bookmarkBtn.getAttribute('data-id'));
          return;
        }

        const card = e.target.closest('.concept-card');
        if (card) {
          openModal(card.getAttribute('data-id'));
        }
      });
    }

    // Modal Events
    if (dom.modalCloseBtn) {
      dom.modalCloseBtn.addEventListener('click', closeModal);
    }
    if (dom.modalOverlay) {
      dom.modalOverlay.addEventListener('click', (e) => {
        if (e.target === dom.modalOverlay) closeModal();
      });
    }
    if (dom.modalContent) {
      dom.modalContent.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.btn-play-verse');
        if (playBtn) {
          const itemId = Number(playBtn.getAttribute('data-item-id'));
          const item = window.APP_DATA.items.find(i => i.id === itemId);
          if (item) {
            if (state.currentVerse && state.currentVerse.itemId === itemId && state.isPlaying) {
              state.audio.pause();
            } else {
              playVerse({
                itemId: item.id,
                surah: item.verse.surah,
                ayah: item.verse.ayah,
                surahName: item.verse.surahName,
                textArabic: item.verse.textArabic,
                audioUrl: item.verse.audioUrl
              });
            }
          }
          return;
        }

        const bookmarkBtn = e.target.closest('.btn-bookmark');
        if (bookmarkBtn) {
          toggleBookmark(bookmarkBtn.getAttribute('data-id'));
          openModal(bookmarkBtn.getAttribute('data-id'));
          return;
        }

        const copyBtn = e.target.closest('.btn-copy-quote');
        if (copyBtn) {
          const text = copyBtn.getAttribute('data-quote');
          copyTextToClipboard(text);
        }
      });
    }

    // Reservations Accordion
    if (dom.reservationsContainer) {
      dom.reservationsContainer.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.btn-play-verse');
        if (playBtn) {
          e.stopPropagation();
          const audioUrl = playBtn.getAttribute('data-audio');
          const surah = playBtn.getAttribute('data-surah');
          const ref = playBtn.getAttribute('data-ref');
          const arabic = playBtn.getAttribute('data-arabic');
          playVerse({
            itemId: 'res',
            surahName: surah,
            surah: ref.split(':')[0],
            ayah: ref.split(':')[1],
            textArabic: arabic,
            audioUrl: audioUrl
          });
          return;
        }

        const header = e.target.closest('.reservation-header');
        if (header) {
          const card = header.closest('.reservation-card');
          card.classList.toggle('open');
        }
      });
    }

    if (dom.reservationSearch) {
      dom.reservationSearch.addEventListener('input', renderReservations);
    }

    // Questions & Journal
    if (dom.questionsContainer) {
      dom.questionsContainer.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.btn-play-verse');
        if (playBtn) {
          const audioUrl = playBtn.getAttribute('data-audio');
          const surah = playBtn.getAttribute('data-surah');
          const ref = playBtn.getAttribute('data-ref');
          const arabic = playBtn.getAttribute('data-arabic');
          playVerse({
            itemId: 'q',
            surahName: surah,
            surah: ref.split(':')[0],
            ayah: ref.split(':')[1],
            textArabic: arabic,
            audioUrl: audioUrl
          });
          return;
        }

        const saveBtn = e.target.closest('.journal-save-btn');
        if (saveBtn) {
          const qid = saveBtn.getAttribute('data-qid');
          const textarea = document.querySelector(`.journal-textarea[data-qid="${qid}"]`);
          if (textarea) {
            saveJournalNote(qid, textarea.value);
            showToast('Reflection saved to local journal!');
          }
        }
      });

      dom.questionsContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('journal-textarea')) {
          const qid = e.target.getAttribute('data-qid');
          saveJournalNote(qid, e.target.value);
        }
      });
    }

    if (dom.exportJournalBtn) {
      dom.exportJournalBtn.addEventListener('click', exportJournal);
    }

        // Flashcard Studio Controls
    if (dom.flashcardWrapper) {
      dom.flashcardWrapper.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.btn-play-verse');
        if (playBtn) {
          e.stopPropagation();
          const itemId = Number(playBtn.getAttribute('data-item-id'));
          const item = window.APP_DATA.items.find(i => i.id === itemId);
          if (item) {
            if (state.currentVerse && state.currentVerse.itemId === itemId && state.isPlaying) {
              state.audio.pause();
            } else {
              playVerse({
                itemId: item.id,
                surah: item.verse.surah,
                ayah: item.verse.ayah,
                surahName: item.verse.surahName,
                textArabic: item.verse.textArabic,
                audioUrl: item.verse.audioUrl
              });
            }
          }
          return;
        }
        toggleFlashcardFlip();
      });
    }

    if (dom.flashFlipBtn) {
      dom.flashFlipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFlashcardFlip();
      });
    }

    if (dom.flashNextBtn) dom.flashNextBtn.addEventListener('click', nextFlashcard);
    if (dom.flashPrevBtn) dom.flashPrevBtn.addEventListener('click', prevFlashcard);
    if (dom.flashShuffleBtn) dom.flashShuffleBtn.addEventListener('click', shuffleFlashcards);

    if (dom.btnMarkMastered) {
      dom.btnMarkMastered.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMasteryCurrentCard();
      });
    }

    if (dom.flashCategorySelect) {
      dom.flashCategorySelect.addEventListener('change', (e) => {
        state.flashcardCategory = e.target.value;
        updateFlashcardDeck();
        showToast(`Deck switched to: ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    // Quotes Carousel Controls
    if (dom.quoteNextBtn) dom.quoteNextBtn.addEventListener('click', nextQuote);
    if (dom.quotePrevBtn) dom.quotePrevBtn.addEventListener('click', prevQuote);

    // Audio Bar Controls
    if (dom.audioPlayBtn) dom.audioPlayBtn.addEventListener('click', togglePlayPause);
    if (dom.audioNextBtn) dom.audioNextBtn.addEventListener('click', playNextTrack);
    if (dom.audioPrevBtn) dom.audioPrevBtn.addEventListener('click', playPrevTrack);

    if (dom.audioSeekBar) {
      dom.audioSeekBar.addEventListener('input', (e) => {
        if (state.audio.duration) {
          state.audio.currentTime = (e.target.value / 100) * state.audio.duration;
        }
      });
    }

    if (dom.audioSpeedSelect) {
      dom.audioSpeedSelect.addEventListener('change', (e) => {
        state.playbackRate = parseFloat(e.target.value);
        state.audio.playbackRate = state.playbackRate;
      });
    }

    if (dom.audioAutoToggle) {
      dom.audioAutoToggle.addEventListener('click', () => {
        state.autoPlayNext = !state.autoPlayNext;
        dom.audioAutoToggle.style.color = state.autoPlayNext ? 'var(--accent-gold-bright)' : 'var(--text-muted)';
        showToast(state.autoPlayNext ? 'Auto-play continuous recitation: ON' : 'Auto-play continuous recitation: OFF');
      });
    }

    if (dom.audioCloseBtn) {
      dom.audioCloseBtn.addEventListener('click', () => {
        state.audio.pause();
        dom.audioPlayerBar.classList.add('minimized');
      });
    }

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
      if (state.activeTab === 'flashcards' && !['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          dom.flashcardWrapper.classList.toggle('flipped');
        } else if (e.key === 'ArrowRight') {
          nextFlashcard();
        } else if (e.key === 'ArrowLeft') {
          prevFlashcard();
        }
      }
    });

    // Hash change listener
    window.addEventListener('hashchange', checkUrlHash);
  }

  // Run upon DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
