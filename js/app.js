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
    masteredCards: JSON.parse(localStorage.getItem('100top_mastered_cards') || '[]'),
    activeFlashcardIndex: 0,
    flashcardCategory: 'all',
    flashcardDeck: [],
    flashcardReverseMode: false,
    theme: localStorage.getItem('100top_theme') || 'emerald',
    arabicFontScale: localStorage.getItem('100top_arabic_scale') || 'md',
    
    // Audio Player State
    audio: new Audio(),
    currentVerse: null,
    isPlaying: false,
    autoPlayNext: true,
    repeatMode: localStorage.getItem('100top_repeat_mode') || 'all', // 'one' | 'all' | 'off'
    selectedReciter: localStorage.getItem('100top_reciter') || 'Alafasy_128kbps',
    volume: parseFloat(localStorage.getItem('100top_volume') || '1.0'),
    isMuted: false,
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

        // Top 20 New Controls
    audioReciterSelect: document.getElementById('audio-reciter-select'),
    audioRepeatBtn: document.getElementById('audio-repeat-btn'),
    audioVolumeBtn: document.getElementById('audio-volume-btn'),
    audioVolumeSlider: document.getElementById('audio-volume-slider'),
    btnRandomDimension: document.getElementById('btn-random-dimension'),
    btnFontScales: document.querySelectorAll('.btn-font-scale'),
    btnToggleAllReservations: document.getElementById('btn-toggle-all-reservations'),
    toggleAllResText: document.getElementById('toggle-all-res-text'),
    btnFlashModeToggle: document.getElementById('btn-flash-mode-toggle'),
    flashModeLabel: document.getElementById('flash-mode-label'),
    btnBackupData: document.getElementById('btn-backup-data'),
    btnRestoreDataTrigger: document.getElementById('btn-restore-data-trigger'),
    restoreFileInput: document.getElementById('restore-file-input'),
    backToTopBtn: document.getElementById('back-to-top-btn'),
    keyboardShortcutsBtn: document.getElementById('keyboard-shortcuts-btn'),
    shortcutsModal: document.getElementById('shortcuts-modal'),
    shortcutsCloseBtn: document.getElementById('shortcuts-close-btn'),
    shortcutsDoneBtn: document.getElementById('shortcuts-done-btn'),
    toastContainer: document.getElementById('toast-container')
  };

    // =========================================================================
  // ARABIC TASHKEEL NORMALIZER & DIACRITICS STRIPPER
  // =========================================================================
  function normalizeArabic(text) {
    if (!text) return '';
    return text
      .replace(/[\u064B-\u065F\u0670]/g, '') // strip harakat (fathatan, dammatan, fatha, damma, etc.)
      .replace(/[إأآٱ]/g, 'ا') // unify Alef variants
      .replace(/[ى]/g, 'ي') // unify Yaa
      .replace(/[ة]/g, 'ه') // unify Taa Marbuta
      .replace(/[ؤ]/g, 'و') // unify Waw Hamza
      .replace(/[ئ]/g, 'ي') // unify Yaa Hamza
      .replace(/[؀-؅؛؞؟ءۖ-ۜ۟-۪ۨ-ۭ]/g, '')
      .replace(/[\s\-_,\.]+/g, ' ')
      .trim()
      .toLowerCase();
  }


  // =========================================================================
  // ARABIC FONT SCALER & RECITER CONTROLLERS
  // =========================================================================
  function applyArabicFontScale(scale) {
    state.arabicFontScale = scale;
    document.documentElement.setAttribute('data-arabic-scale', scale);
    localStorage.setItem('100top_arabic_scale', scale);
    if (dom.btnFontScales) {
      dom.btnFontScales.forEach(btn => {
        if (btn.getAttribute('data-scale') === scale) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  function initReciterAndVolume() {
    if (dom.audioReciterSelect) {
      dom.audioReciterSelect.value = state.selectedReciter;
    }
    if (dom.audioVolumeSlider) {
      dom.audioVolumeSlider.value = state.volume;
      state.audio.volume = state.volume;
    }
    updateRepeatModeUI();
  }

  function updateRepeatModeUI() {
    if (!dom.audioRepeatBtn) return;
    dom.audioRepeatBtn.classList.remove('repeat-one', 'repeat-all');
    if (state.repeatMode === 'one') {
      dom.audioRepeatBtn.classList.add('repeat-one');
      dom.audioRepeatBtn.title = 'Repeat Mode: Single Ayah Loop (Hifdh)';
    } else if (state.repeatMode === 'all') {
      dom.audioRepeatBtn.classList.add('repeat-all');
      dom.audioRepeatBtn.title = 'Repeat Mode: Auto-Play Next Ayah';
    } else {
      dom.audioRepeatBtn.title = 'Repeat Mode: Stop at End';
    }
  }

  function cycleRepeatMode() {
    if (state.repeatMode === 'all') {
      state.repeatMode = 'one';
      showToast('🔂 Loop 1 Ayah: Repeat single verse for memorization');
    } else if (state.repeatMode === 'one') {
      state.repeatMode = 'off';
      showToast('⏹ Normal Mode: Stop playback after current verse');
    } else {
      state.repeatMode = 'all';
      showToast('🔁 Continuous Mode: Stream next verses automatically');
    }
    localStorage.setItem('100top_repeat_mode', state.repeatMode);
    updateRepeatModeUI();
  }

  function animateHeroNumbers() {
    const chips = document.querySelectorAll('.stat-number');
    chips.forEach(chip => {
      const rawText = chip.textContent.replace(/,/g, '');
      const target = parseInt(rawText, 10);
      if (isNaN(target)) return;

      let current = 0;
      const duration = 1200;
      const start = performance.now();

      function updateCounter(now) {
        const progress = Math.min((now - start) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const val = Math.floor(easeOut * target);
        chip.textContent = val > 999 ? val.toLocaleString() : val;
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          chip.textContent = target > 999 ? target.toLocaleString() : target;
        }
      }
      requestAnimationFrame(updateCounter);
    });
  }

  // =========================================================================
  // TOUCH GESTURES (Mobile / Tablet Swipe)
  // =========================================================================
  function initTouchGestures() {
    // Flashcard touch swipe
    if (dom.flashcardWrapper) {
      let touchStartX = 0;
      let touchEndX = 0;

      dom.flashcardWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      dom.flashcardWrapper.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });

      function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
          nextFlashcard(); // Swipe Left -> Next
        } else if (touchEndX > touchStartX + threshold) {
          prevFlashcard(); // Swipe Right -> Prev
        }
      }
    }

    // Quotes carousel touch swipe
    if (dom.quoteBox) {
      let quoteStartX = 0;
      let quoteEndX = 0;

      dom.quoteBox.addEventListener('touchstart', (e) => {
        quoteStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      dom.quoteBox.addEventListener('touchend', (e) => {
        quoteEndX = e.changedTouches[0].screenX;
        const threshold = 40;
        if (quoteEndX < quoteStartX - threshold) {
          nextQuote();
        } else if (quoteEndX > quoteStartX + threshold) {
          prevQuote();
        }
      }, { passive: true });
    }
  }

  // =========================================================================
  // "SURPRISE ME" / RANDOM DIMENSION DISCOVERY
  // =========================================================================
  function pickRandomDimension() {
    if (!window.APP_DATA || !window.APP_DATA.items.length) return;
    const randomIndex = Math.floor(Math.random() * window.APP_DATA.items.length);
    const item = window.APP_DATA.items[randomIndex];

    // Reset filters
    state.searchQuery = '';
    if (dom.searchInput) dom.searchInput.value = '';
    state.selectedCategory = 'all';
    state.onlyBookmarks = false;
    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    const allChip = document.querySelector('.category-chip[data-cat="all"]');
    if (allChip) allChip.classList.add('active');

    if (state.activeTab !== 'concepts') {
      switchTab('concepts', false);
    }
    renderCards();

    // Scroll to and highlight selected card
    setTimeout(() => {
      const card = document.querySelector(`.concept-card[data-id="${item.id}"]`);
      if (card) {
        card.classList.add('card-highlight-target');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          card.classList.remove('card-highlight-target');
          openModal(item.id);
        }, 800);
      }
    }, 150);

    showToast(`✨ Surprise Gem: #${item.id} ${item.title}`);
  }

  // =========================================================================
  // DATA BACKUP & RESTORE (JSON EXPORT/IMPORT)
  // =========================================================================
  function backupUserData() {
    const backupData = {
      app: '100Top Islam & Quran',
      version: '1.0.6',
      exportedAt: new Date().toISOString(),
      bookmarks: state.bookmarks,
      masteredCards: state.masteredCards,
      journalNotes: state.journalNotes,
      theme: state.theme,
      reciter: state.selectedReciter
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `100top_islam_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('User data backup exported successfully! 💾');
  }

  function restoreUserData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.bookmarks && Array.isArray(data.bookmarks)) {
          state.bookmarks = data.bookmarks;
          localStorage.setItem('100top_bookmarks', JSON.stringify(state.bookmarks));
        }
        if (data.masteredCards && Array.isArray(data.masteredCards)) {
          state.masteredCards = data.masteredCards;
          localStorage.setItem('100top_mastered_cards', JSON.stringify(state.masteredCards));
        }
        if (data.journalNotes && typeof data.journalNotes === 'object') {
          state.journalNotes = data.journalNotes;
          localStorage.setItem('100top_journal', JSON.stringify(state.journalNotes));
        }
        renderCards();
        renderQuestions();
        renderCurrentFlashcard();
        showToast('Backup restored successfully! 🎉');
      } catch (err) {
        console.error(err);
        showToast('Error restoring backup file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  }

  // =========================================================================
  // SHARE / COPY AYAH
  // =========================================================================
  function shareAyah(itemId) {
    const item = window.APP_DATA.items.find(i => i.id === itemId);
    if (!item) return;

    const sharePayload = {
      title: `100Top Islam: ${item.title} (${item.arabic})`,
      text: `"${item.verse.textArabic}"\n"${item.verse.textEnglish}"\n— Surah ${item.verse.surahName} (${item.verse.surah}:${item.verse.ayah})\n\nCore Dimension: ${item.title} (Root: ${item.root})\nSummary: ${item.summary}\nPractical Action: ${item.practicalTakeaway}\n\nExplore 200 Dimensions of Islam & Quran:`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(sharePayload).catch(() => {});
    } else {
      copyTextToClipboard(`${sharePayload.title}\n\n${sharePayload.text}\n${sharePayload.url}`);
      showToast('Ayah and Dimension copied to clipboard! 📋');
    }
  }

  // =========================================================================
  // TOGGLE ALL RESERVATIONS
  // =========================================================================
  function toggleAllReservations() {
    const cards = document.querySelectorAll('.reservation-card');
    const anyClosed = Array.from(cards).some(card => !card.classList.contains('open'));
    cards.forEach(card => {
      if (anyClosed) {
        card.classList.add('open');
      } else {
        card.classList.remove('open');
      }
    });

    if (dom.toggleAllResText) {
      dom.toggleAllResText.textContent = anyClosed ? 'Collapse All' : 'Expand All';
    }
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function init() {
        applyTheme(state.theme);
    applyArabicFontScale(state.arabicFontScale);
    initReciterAndVolume();
    initCanvas();
    animateHeroNumbers();
    renderCategories();
    renderCards();
    renderReservations();
    renderQuestions();
    initFlashcards();
    renderQuote();
    initAudioEngine();
    initTouchGestures();
    bindEvents();
    checkUrlHash();
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

      // Per-domain accent color
      const domainColors = {
        'Arabic Linguistics': '#4f8ef7',
        'Quranic Sciences':   '#a78bfa',
        'Theology':           '#f59e0b',
        'Pillars':            '#10b981',
        'Spiritual':          '#ec4899',
        'Prophetic':          '#f97316',
        'Jurisprudence':      '#06b6d4',
        'Islamic Civilization': '#8b5cf6',
        'Contemporary':       '#22c55e',
        'Cosmology':          '#38bdf8',
      };
      const catKey = Object.keys(domainColors).find(k => item.category.includes(k)) || 'Theology';
      const domainColor = domainColors[catKey];

      return `
        <div class="concept-card" data-id="${item.id}" style="--domain-color: ${domainColor}">
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
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="btn-share-ayah btn-icon" data-id="${item.id}" title="Share Ayah & Takeaway" style="width: 38px; height: 38px;">
            <i class="fas fa-share-nodes"></i>
          </button>
          <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-id="${item.id}" style="font-size: 1.3rem;">
            <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
          </button>
        </div>
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
      const wordCount = savedNote.trim() ? savedNote.trim().split(/\s+/).length : 0;
      const charCount = savedNote.length;

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
            <div class="journal-footer-row">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <button class="journal-save-btn" data-qid="${q.id}">
                  <i class="fas fa-save"></i> Save Reflection
                </button>
                <span class="journal-save-status" data-qid="${q.id}">
                  <i class="fas fa-check-circle"></i> Saved!
                </span>
              </div>
              <span class="journal-counter-text" data-qid="${q.id}">
                ${wordCount} words • ${charCount} chars
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach input listeners for live word counting
    dom.questionsContainer.querySelectorAll('.journal-textarea').forEach(ta => {
      ta.addEventListener('input', () => {
        const qid = ta.getAttribute('data-qid');
        const text = ta.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const counter = dom.questionsContainer.querySelector(`.journal-counter-text[data-qid="${qid}"]`);
        if (counter) counter.textContent = `${words} words • ${text.length} chars`;
      });
    });
  }

  function saveJournalNote(qid, text) {
    state.journalNotes[qid] = text;
    localStorage.setItem('100top_journal', JSON.stringify(state.journalNotes));
    const status = dom.questionsContainer.querySelector(`.journal-save-status[data-qid="${qid}"]`);
    if (status) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      status.innerHTML = `<i class="fas fa-check-circle"></i> Saved at ${timeStr}`;
      status.classList.add('visible');
      setTimeout(() => { status.classList.remove('visible'); }, 3000);
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

        // Render Front & Back depending on Reverse Mode
    if (!state.flashcardReverseMode) {
      // Front Side (Arabic Calligraphy & Root)
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
    } else {
      // REVERSE MODE: Front Side has English & Clues
      dom.flashcardFront.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="card-id-badge" style="font-size: 0.85rem;">Reverse Card #${String(item.id).padStart(3, '0')}</span>
          <span class="card-category-tag" style="font-size: 0.8rem;">${item.category}</span>
        </div>

        <div style="margin: auto 0; padding: 1.5rem 0; text-align: center;">
          <div style="font-size: 0.82rem; color: var(--accent-gold-bright); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem;">
            Recall the Arabic Term & Linguistic Root for:
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 0.75rem;">${item.title}</h3>
          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; max-width: 550px; margin: 0 auto;">${item.summary}</p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.8rem; color: var(--accent-emerald-bright);"><i class="fas fa-brain"></i> Active Recall</span>
          <div style="color: var(--text-muted); font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
            <i class="fas fa-hand-pointer text-gold"></i> Click to Reveal Arabic
          </div>
        </div>
      `;

      // REVERSE MODE: Back Side reveals Arabic Calligraphy & Root
      dom.flashcardBack.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="card-id-badge" style="background: rgba(16,185,129,0.15); color: var(--accent-emerald-bright); font-size: 0.85rem;">
            <i class="fas fa-check"></i> Term Reveal
          </span>
          <span class="card-category-tag" style="font-size: 0.8rem;">${item.category}</span>
        </div>

        <div style="text-align: center; margin: auto 0; padding: 1rem 0;">
          <div class="font-arabic" style="font-size: 3.2rem; color: var(--text-arabic); line-height: 1.3; margin-bottom: 0.75rem;">
            ${item.arabic}
          </div>
          <div class="card-root-box" style="font-size: 1.1rem; padding: 0.4rem 1.2rem; margin-bottom: 1rem;">
            Linguistic Root: <strong>${item.root}</strong>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-secondary);">Surah ${item.verse.surahName} (${item.verse.surah}:${item.verse.ayah})</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
          <button class="btn-play-verse ${isCurrentlyPlaying ? 'playing' : ''}" data-item-id="${item.id}" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">
            <i class="fas ${isCurrentlyPlaying ? 'fa-pause' : 'fa-play'}"></i> <span>Recite</span>
          </button>
          <span style="color: var(--accent-gold-bright); font-size: 0.85rem; font-weight: 700; cursor: pointer;">
            Flip Back <i class="fas fa-rotate"></i>
          </span>
        </div>
      `;
    }
  }

  function toggleFlashcardMode() {
    state.flashcardReverseMode = !state.flashcardReverseMode;
    if (dom.flashModeLabel) {
      dom.flashModeLabel.textContent = state.flashcardReverseMode ? 'Mode: Meaning → Term' : 'Mode: Term → Meaning';
    }
    renderCurrentFlashcard();
    showToast(state.flashcardReverseMode ? 'Reverse Mode: Meaning on Front, Arabic on Back' : 'Standard Mode: Arabic on Front, Meaning on Back');
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
    function getReciterAudioUrl(surah, ayah) {
    const s = String(surah).padStart(3, '0');
    const a = String(ayah).padStart(3, '0');
    return `https://everyayah.com/data/${state.selectedReciter}/${s}${a}.mp3`;
  }

  function initAudioEngine() {
        state.audio.addEventListener('timeupdate', () => {
      if (dom.audioSeekBar && state.audio.duration) {
        const percent = (state.audio.currentTime / state.audio.duration) * 100;
        dom.audioSeekBar.value = percent;
        dom.audioSeekBar.style.setProperty('--seek-percent', `${percent}%`);
        if (dom.audioCurrentTime) dom.audioCurrentTime.textContent = formatTime(state.audio.currentTime);
        if (dom.audioDuration) dom.audioDuration.textContent = formatTime(state.audio.duration);
      }
    });

    state.audio.addEventListener('ended', () => {
      if (state.repeatMode === 'one') {
        state.audio.currentTime = 0;
        state.audio.play().catch(() => {});
      } else if (state.repeatMode === 'all') {
        playNextTrack();
      } else {
        state.isPlaying = false;
        updateAudioUI();
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
    const dynamicAudioUrl = getReciterAudioUrl(verseData.surah, verseData.ayah);
    state.audio.src = dynamicAudioUrl;
    state.audio.playbackRate = state.playbackRate;
    state.audio.volume = state.isMuted ? 0 : state.volume;
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
    const reciterLabel = dom.audioReciterSelect ? dom.audioReciterSelect.options[dom.audioReciterSelect.selectedIndex].text : 'Sheikh Mishary Alafasy';
    if (dom.audioVerseRef) dom.audioVerseRef.textContent = `Verse (${verseData.surah}:${verseData.ayah}) • ${reciterLabel}`;
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

    // Equalizer animation: show when playing
    const eqBars = document.getElementById('audio-eq-bars');
    const badgeIcon = document.getElementById('audio-badge-icon');
    if (eqBars && badgeIcon) {
      if (state.isPlaying) {
        eqBars.style.display = 'flex';
        badgeIcon.style.display = 'none';
      } else {
        eqBars.style.display = 'none';
        badgeIcon.style.display = '';
      }
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
        const copyBtn = e.target.closest('.btn-copy-quote');
        if (copyBtn) {
          const quote = copyBtn.getAttribute('data-quote');
          copyTextToClipboard(`"${quote}" - Linguistic Gem from 100Top Islam`);
          showToast('Wisdom gem copied to clipboard!');
        }
        const shareBtn = e.target.closest('.btn-share-ayah');
        if (shareBtn) {
          const itemId = Number(shareBtn.getAttribute('data-id'));
          shareAyah(itemId);
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


    // Top 20 New Event Listeners
    // 1. Font Scaler
    if (dom.btnFontScales) {
      dom.btnFontScales.forEach(btn => {
        btn.addEventListener('click', () => {
          applyArabicFontScale(btn.getAttribute('data-scale'));
        });
      });
    }

    // 2. Random Dimension (Surprise Me)
    if (dom.btnRandomDimension) {
      dom.btnRandomDimension.addEventListener('click', pickRandomDimension);
    }

    // 3. Multi-Reciter Selector
    if (dom.audioReciterSelect) {
      dom.audioReciterSelect.addEventListener('change', (e) => {
        state.selectedReciter = e.target.value;
        localStorage.setItem('100top_reciter', state.selectedReciter);
        if (state.currentVerse) {
          const wasPlaying = state.isPlaying;
          state.audio.src = getReciterAudioUrl(state.currentVerse.surah, state.currentVerse.ayah);
          if (wasPlaying) state.audio.play().catch(() => {});
          if (dom.audioVerseRef) {
            const label = e.target.options[e.target.selectedIndex].text;
            dom.audioVerseRef.textContent = `Verse (${state.currentVerse.surah}:${state.currentVerse.ayah}) • ${label}`;
          }
        }
        showToast(`Reciter switched to: ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    // 4. Repeat Mode Button
    if (dom.audioRepeatBtn) {
      dom.audioRepeatBtn.addEventListener('click', cycleRepeatMode);
    }

    // 5. Volume Slider & Mute Button
    if (dom.audioVolumeSlider) {
      dom.audioVolumeSlider.addEventListener('input', (e) => {
        state.volume = parseFloat(e.target.value);
        state.isMuted = state.volume === 0;
        state.audio.volume = state.volume;
        localStorage.setItem('100top_volume', state.volume);
        if (dom.audioVolumeBtn) {
          dom.audioVolumeBtn.innerHTML = state.volume === 0 ? '<i class="fas fa-volume-xmark"></i>' : (state.volume < 0.5 ? '<i class="fas fa-volume-low"></i>' : '<i class="fas fa-volume-high"></i>');
        }
      });
    }

    if (dom.audioVolumeBtn) {
      dom.audioVolumeBtn.addEventListener('click', () => {
        state.isMuted = !state.isMuted;
        state.audio.volume = state.isMuted ? 0 : state.volume;
        dom.audioVolumeBtn.innerHTML = state.isMuted ? '<i class="fas fa-volume-xmark"></i>' : '<i class="fas fa-volume-high"></i>';
        showToast(state.isMuted ? 'Audio Muted' : 'Audio Unmuted');
      });
    }

    // 6. Expand/Collapse All Reservations
    if (dom.btnToggleAllReservations) {
      dom.btnToggleAllReservations.addEventListener('click', toggleAllReservations);
    }

    // 7. Flashcard Reverse Mode
    if (dom.btnFlashModeToggle) {
      dom.btnFlashModeToggle.addEventListener('click', toggleFlashcardMode);
    }

    // 8. Data Backup & Restore
    if (dom.btnBackupData) {
      dom.btnBackupData.addEventListener('click', backupUserData);
    }

    if (dom.btnRestoreDataTrigger && dom.restoreFileInput) {
      dom.btnRestoreDataTrigger.addEventListener('click', () => dom.restoreFileInput.click());
      dom.restoreFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          restoreUserData(e.target.files[0]);
          e.target.value = '';
        }
      });
    }

    // 9. Floating Back-to-Top Button
    if (dom.backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
          dom.backToTopBtn.classList.add('visible');
        } else {
          dom.backToTopBtn.classList.remove('visible');
        }
      }, { passive: true });

      dom.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 10. Keyboard Shortcuts Modal & Shortcut Key Handler
    if (dom.keyboardShortcutsBtn) {
      dom.keyboardShortcutsBtn.addEventListener('click', () => {
        if (dom.shortcutsModal) dom.shortcutsModal.classList.add('active');
      });
    }

    if (dom.shortcutsCloseBtn) {
      dom.shortcutsCloseBtn.addEventListener('click', () => {
        if (dom.shortcutsModal) dom.shortcutsModal.classList.remove('active');
      });
    }

    if (dom.shortcutsDoneBtn) {
      dom.shortcutsDoneBtn.addEventListener('click', () => {
        if (dom.shortcutsModal) dom.shortcutsModal.classList.remove('active');
      });
    }

    if (dom.shortcutsModal) {
      dom.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === dom.shortcutsModal) dom.shortcutsModal.classList.remove('active');
      });
    }

    // Card delegation for Share Ayah
    if (dom.cardsContainer) {
      dom.cardsContainer.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('.btn-share-ayah');
        if (shareBtn) {
          e.stopPropagation();
          const itemId = Number(shareBtn.getAttribute('data-id'));
          shareAyah(itemId);
        }
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

    // Navbar scroll shadow
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }, { passive: true });
    }
  }

  // Run upon DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
