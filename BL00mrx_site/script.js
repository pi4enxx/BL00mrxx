// =========== СПИСОК БИТОВ ===========
const BEATS_LIST = [
  '0198.mp3',
  '0224.mp3', 
  '0271.mp3',
  '0311.mp3',
  '0212.mp3'
];

// =========== ФУНКЦИЯ ДЛЯ БЕЗОПАСНОГО КОДИРОВАНИЯ ===========
function encodeFilename(filename) {
  // Сначала кодируем полностью
  let encoded = encodeURIComponent(filename);
  // Но оставляем слеш для папок
  encoded = encoded.replace(/%2F/g, '/');
  return encoded;
}

function decodeFilename(encoded) {
  return decodeURIComponent(encoded);
}

// =========== СОЗДАНИЕ БИТОВ ИЗ СПИСКА ===========
function createBeatsFromList() {
  beats = BEATS_LIST.map(filename => {
    // Безопасное имя для отображения
    const displayName = filename
      .replace('.mp3', '')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .toUpperCase();
    
    // Закодированное имя для URL
    const encodedFilename = encodeFilename(filename);
    
    // Определяем цену
    const lowerName = filename.toLowerCase();
    const isFree = lowerName.includes('free') || 
                   lowerName.includes('demo') ||
                   lowerName.includes('sample');
    
    return {
      originalFilename: filename,
      encodedFilename: encodedFilename,
      name: displayName,
      file: `assets/beats/${encodedFilename}`,
      price: isFree ? 'FREE' : '$30',
      duration: '0:00'
    };
  });
  
  console.log('📀 Загружено битов:', beats.length);
  createBeatsList();
}

// =========== ЗАГРУЗКА БИТА ===========
function loadBeat(index) {
  if (!beats[index]) return;
  
  currentBeatIndex = index;
  const beat = beats[index];
  
  console.log('🎵 Загружаем бит:', {
    original: beat.originalFilename,
    encoded: beat.encodedFilename,
    path: beat.file
  });
  
  // Пробуем разные варианты путей
  const paths = [
    beat.file, // Закодированный
    `assets/beats/${beat.originalFilename}`, // Оригинальный
    `./assets/beats/${encodeURIComponent(beat.originalFilename)}` // Полностью закодированный
  ];
  
  // Пробуем загрузить
  loadAudioFromPaths(paths, beat);
  
  nowPlaying.textContent = beat.name;
  selectBeat(index);
}

function loadAudioFromPaths(paths, beat) {
  let audioLoaded = false;
  
  paths.forEach((path, i) => {
    const testAudio = new Audio();
    testAudio.preload = 'auto';
    testAudio.src = path;
    
    testAudio.addEventListener('canplay', () => {
      if (!audioLoaded) {
        audioLoaded = true;
        console.log(`✅ Загружен по пути ${i + 1}:`, path);
        audioElement.src = path;
        audioElement.load();
      }
    });
    
    testAudio.addEventListener('error', (e) => {
      console.log(`❌ Ошибка пути ${i + 1}:`, path, e);
    });
    
    // Запускаем загрузку
    testAudio.load();
  });
}

// =========== ПЕРЕМЕННЫЕ ===========
let canScroll = false;
let rafId = null;
let currentVolume = 1;
let currentOpacity = 1;
let targetVolume = 1;
let targetOpacity = 1;
let pauseScheduled = false;

let beats = []; // Все биты
let currentBeatIndex = 0;
let isPlayerVisible = false;
let isDragging = false;

// =========== ЭЛЕМЕНТЫ ===========
const enterScreen = document.getElementById("enter-screen");
const video = document.getElementById("bg-video");
const card = document.querySelector(".card");
const scrollArrow = document.querySelector(".scroll-indicator");
const beatsContainer = document.getElementById("beats-container");
const audioElement = document.getElementById("audio-player");
const playerUI = document.querySelector('.audio-player');
const nowPlaying = document.getElementById('now-playing');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const volumeSlider = document.getElementById('volume-slider');
const closePlayerBtn = document.getElementById('close-player');

// =========== ИНИЦИАЛИЗАЦИЯ ===========
function init() {
  // Настройка видео
  video.preload = "auto";
  video.muted = true;
  video.loop = true;
  card.classList.add("hidden");
  scrollArrow.style.opacity = "0";
  
  // Создаем биты из списка
  createBeatsFromList();
  
  // Настраиваем аудиоплеер
  setupAudioPlayer();
}

// =========== СОЗДАНИЕ БИТОВ ИЗ СПИСКА ===========
function createBeatsFromList() {
  beats = BEATS_LIST.map(filename => {
    // Преобразуем имя файла в название
    const name = filename
      .replace('.mp3', '')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .toUpperCase();
    
    // Определяем цену
    const isFree = filename.toLowerCase().includes('free') || 
                   filename.toLowerCase().includes('demo');
    
    return {
      filename: filename,
      name: name,
      file: 'assets/beats/' + filename,
      price: isFree ? 'FREE' : '$30',
      duration: '0:00'
    };
  });
  
  createBeatsList();
}

// =========== СОЗДАНИЕ СПИСКА БИТОВ ===========
function createBeatsList() {
  if (beats.length === 0) {
    beatsContainer.innerHTML = '<div class="no-beats">No beats found</div>';
    return;
  }
  
  beatsContainer.innerHTML = '';
  
  beats.forEach((beat, index) => {
    const beatItem = document.createElement('div');
    beatItem.className = 'beat-item';
    beatItem.dataset.index = index;
    
    beatItem.innerHTML = `
      <div class="beat-content">
        <div class="beat-icon">
          <i class="fas fa-music"></i>
        </div>
        <div class="beat-text">
          <div class="beat-name">${beat.name}</div>
          <div class="beat-duration">${beat.duration}</div>
        </div>
        <div class="beat-controls">
          <button class="buy-btn ${beat.price === 'FREE' ? 'free' : ''}">
            ${beat.price}
          </button>
          <button class="play-btn">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>
      <div class="beat-line"></div>
    `;
    
    beatsContainer.appendChild(beatItem);
    
    // Получаем длительность
    getAudioDuration(beat.file).then(duration => {
      if (duration) {
        const durationElement = beatItem.querySelector('.beat-duration');
        durationElement.textContent = formatTime(duration);
        beat.duration = formatTime(duration);
      }
    });
  });
}

// =========== ПОЛУЧЕНИЕ ДЛИТЕЛЬНОСТИ ===========
function getAudioDuration(url) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', () => {
      resolve(null);
    });
    audio.src = url;
    audio.load();
  });
}

// =========== ENTER CLICK ===========
enterScreen.addEventListener("click", async () => {
  enterScreen.style.opacity = "0";
  setTimeout(() => enterScreen.remove(), 1000);

  video.muted = false;
  
  try {
    await video.play();
  } catch (err) {
    console.log("Autoplay blocked");
  }

  card.classList.remove("hidden");

  setTimeout(() => {
    canScroll = true;
    scrollArrow.classList.add("show");
  }, 3000);

  startFadeLoop();
});

// =========== СКРОЛЛ И ЗАТУХАНИЕ ===========
window.addEventListener("wheel", e => {
  if (!canScroll) e.preventDefault();
}, { passive: false });

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY || window.pageYOffset;
  
  if (scrollY > 80) {
    targetOpacity = 0;
    targetVolume = 0;
    pauseScheduled = true;
  } else {
    targetOpacity = 1;
    targetVolume = 1;
    pauseScheduled = false;
    if (video.paused) video.play();
  }
  
  if (scrollY < 50 && isPlayerVisible) {
    closePlayer();
  }
});

function startFadeLoop() {
  if (rafId) return;

  function loop() {
    currentOpacity += (targetOpacity - currentOpacity) * 0.35;
    currentOpacity = Math.max(0, Math.min(1, currentOpacity));
    video.style.opacity = currentOpacity;

    currentVolume += (targetVolume - currentVolume) * 0.35;
    if (currentVolume < 0.01) currentVolume = 0;
    currentVolume = Math.max(0, Math.min(1, currentVolume));
    video.volume = currentVolume;

    if (pauseScheduled && currentVolume === 0 && currentOpacity < 0.01) {
      if (!video.paused) video.pause();
      pauseScheduled = false;
    }

    rafId = requestAnimationFrame(loop);
  }

  loop();
}

// =========== АУДИОПЛЕЕР ===========
function setupAudioPlayer() {
  // Клик по биту
  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.play-btn');
    const beatItem = e.target.closest('.beat-item');
    
    if (playBtn && beatItem) {
      e.stopPropagation();
      const index = parseInt(beatItem.dataset.index);
      loadBeat(index);
      playCurrentBeat();
      showPlayer();
    }
  });
  
  // Кнопки плеера
  playPauseBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPrevBeat);
  nextBtn.addEventListener('click', playNextBeat);
  closePlayerBtn.addEventListener('click', closePlayer);
  
  // Прогресс бар
  progressBar.addEventListener('click', seek);
  progressBar.addEventListener('mousedown', () => isDragging = true);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', () => isDragging = false);
  
  // Громкость
  volumeSlider.addEventListener('input', updateVolume);
  
  // События аудио
  audioElement.addEventListener('timeupdate', updateProgress);
  audioElement.addEventListener('loadedmetadata', updateTotalTime);
  audioElement.addEventListener('ended', playNextBeat);
}

function showPlayer() {
  playerUI.style.display = 'block';
  setTimeout(() => playerUI.classList.add('visible'), 10);
  isPlayerVisible = true;
  document.body.classList.add('playing-beat');
  video.style.filter = 'blur(14px) brightness(0.3)';
}

function closePlayer() {
  playerUI.classList.remove('visible');
  setTimeout(() => playerUI.style.display = 'none', 300);
  isPlayerVisible = false;
  document.body.classList.remove('playing-beat');
  video.style.filter = 'blur(14px) brightness(0.6)';
  
  audioElement.pause();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.querySelectorAll('.beat-item').forEach(item => item.classList.remove('active'));
}

function loadBeat(index) {
  if (!beats[index]) return;
  
  currentBeatIndex = index;
  const beat = beats[index];
  
  // Пробуем разные пути
  const paths = [
    beat.file,
    'assets/beats/' + beat.filename,
    './assets/beats/' + beat.filename,
    beat.filename
  ];
  
  // Пробуем загрузить по одному из путей
  let audioLoaded = false;
  
  for (const path of paths) {
    const testAudio = new Audio();
    testAudio.src = path;
    testAudio.load();
    
    testAudio.addEventListener('canplay', () => {
      if (!audioLoaded) {
        audioLoaded = true;
        audioElement.src = path;
        console.log('Loaded audio from:', path);
      }
    });
    
    testAudio.addEventListener('error', () => {
      console.log('Failed to load from:', path);
    });
  }
  
  // Устанавливаем источник и пытаемся загрузить
  audioElement.src = beat.file;
  audioElement.load();
  
  nowPlaying.textContent = beat.name;
  selectBeat(index);
}

function selectBeat(index) {
  document.querySelectorAll('.beat-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const beatItem = document.querySelector(`.beat-item[data-index="${index}"]`);
  if (beatItem) {
    beatItem.classList.add('active');
  }
}

function playCurrentBeat() {
  audioElement.play().then(() => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    console.log('Playing:', audioElement.src);
  }).catch(err => {
    console.log('Play error:', err);
    // Пробуем альтернативный путь
    const beat = beats[currentBeatIndex];
    audioElement.src = 'assets/beats/' + beat.filename;
    audioElement.play().then(() => {
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    });
  });
}

function togglePlay() {
  if (audioElement.paused) {
    playCurrentBeat();
  } else {
    audioElement.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
}

function playPrevBeat() {
  let newIndex = currentBeatIndex - 1;
  if (newIndex < 0) newIndex = beats.length - 1;
  loadBeat(newIndex);
  playCurrentBeat();
}

function playNextBeat() {
  let newIndex = currentBeatIndex + 1;
  if (newIndex >= beats.length) newIndex = 0;
  loadBeat(newIndex);
  playCurrentBeat();
}

function drag(e) {
  if (isDragging) {
    seek(e);
  }
}

function seek(e) {
  const rect = progressBar.getBoundingClientRect();
  let percent = (e.clientX - rect.left) / rect.width;
  percent = Math.max(0, Math.min(1, percent));
  
  const time = percent * audioElement.duration;
  audioElement.currentTime = time;
  progressFill.style.width = `${percent * 100}%`;
  currentTimeEl.textContent = formatTime(time);
}

function updateProgress() {
  if (!isDragging && audioElement.duration) {
    const percent = (audioElement.currentTime / audioElement.duration) * 100;
    progressFill.style.width = `${percent}%`;
    currentTimeEl.textContent = formatTime(audioElement.currentTime);
  }
}

function updateTotalTime() {
  if (audioElement.duration) {
    totalTimeEl.textContent = formatTime(audioElement.duration);
  }
}

function updateVolume() {
  audioElement.volume = volumeSlider.value / 100;
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =========== ЗАПУСК ===========
document.addEventListener('DOMContentLoaded', init);