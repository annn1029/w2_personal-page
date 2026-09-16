/**
 * Yian Chen - 個人首頁與即時時間中心核心指令碼
 * 模組包含：
 * 1. 檔案與路徑動態識別
 * 2. Bento 分頁切換器 (Tab Navigator)
 * 3. 雙核心即時時鐘 (類比錶盤 + 數位大字 + 毫秒級渲染)
 * 4. 番茄鐘專注計時器 (Pomodoro Timer + Web Audio API 合成和弦提示音)
 * 5. 跨時區會議換算器 (World Meeting Planner + 24H 互動滑桿)
 * 6. 主題切換與剪貼簿工具
 */

document.addEventListener('DOMContentLoaded', () => {
  const pageStartTime = Date.now();

  /* ==========================================================================
     1. 動態檔案名稱與路徑識別
     ========================================================================== */
  function initFileInfo() {
    let currentPath = window.location.pathname;
    let filename = currentPath.split('/').filter(Boolean).pop();

    if (!filename || !filename.includes('.')) {
      filename = 'index.html';
    }

    const headerFilename = document.getElementById('header-filename');
    const docFullPath = document.getElementById('doc-full-path');

    if (headerFilename) headerFilename.textContent = filename;
    if (docFullPath) {
      try {
        docFullPath.textContent = decodeURIComponent(window.location.href);
      } catch (e) {
        docFullPath.textContent = window.location.href;
      }
    }
    return filename;
  }

  const activeFilename = initFileInfo();

  /* ==========================================================================
     2. Web Audio API 和弦合成提示音 (Zero External Assets)
     ========================================================================== */
  let audioEnabled = true;
  const audioStateText = document.getElementById('audio-state-text');
  const audioToggleBadge = document.getElementById('audio-toggle-badge');

  function playSoftChime() {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // 輕柔三音和弦 (F5 -> A5 -> C6 琶音，溫暖舒適)
      const notes = [698.46, 880.00, 1046.50];
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

        gain.gain.setValueAtTime(0, startTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, startTime + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.12 + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + idx * 0.12);
        osc.stop(startTime + idx * 0.12 + 1.5);
      });
    } catch (err) {
      console.warn('AudioContext 無法播放音效', err);
    }
  }

  if (audioToggleBadge) {
    audioToggleBadge.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      if (audioStateText) {
        audioStateText.textContent = audioEnabled ? '提示音就緒' : '提示音靜音';
      }
      audioToggleBadge.style.opacity = audioEnabled ? '1' : '0.6';
      if (audioEnabled) playSoftChime();
    });
  }

  /* ==========================================================================
     3. 分頁切換器 (Tab Navigation)
     ========================================================================== */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  /* ==========================================================================
     4. 雙核心即時時鐘 (Live Chronometer)
     ========================================================================== */
  const headerLiveTime = document.getElementById('header-live-time');
  const clockHours = document.getElementById('clock-hours');
  const clockMinutes = document.getElementById('clock-minutes');
  const clockSeconds = document.getElementById('clock-seconds');
  const clockMs = document.getElementById('clock-ms');
  const clockMeridiem = document.getElementById('clock-meridiem');

  const analogHourHand = document.getElementById('analog-hour-hand');
  const analogMinuteHand = document.getElementById('analog-minute-hand');
  const analogSecondHandGroup = document.getElementById('analog-second-hand-group');

  const dateString = document.getElementById('date-string');
  const enDateString = document.getElementById('en-date-string');
  const timezoneString = document.getElementById('timezone-string');
  const unixTimestamp = document.getElementById('unix-timestamp');
  const isoTimestamp = document.getElementById('iso-timestamp');
  const sessionUptimeCounter = document.getElementById('session-uptime-counter');

  const wcTaipei = document.getElementById('wc-time-taipei');
  const wcTokyo = document.getElementById('wc-time-tokyo');
  const wcLondon = document.getElementById('wc-time-london');
  const wcNy = document.getElementById('wc-time-ny');
  const wcSf = document.getElementById('wc-time-sf');

  const btnFormat24h = document.getElementById('btn-format-24h');
  const btnFormat12h = document.getElementById('btn-format-12h');
  const btnModeSmooth = document.getElementById('btn-mode-smooth');
  const btnModeTick = document.getElementById('btn-mode-tick');

  let timeFormat = localStorage.getItem('yc-time-format') || '24h';
  let secondMode = localStorage.getItem('yc-second-mode') || 'smooth';

  function applyClockSettings() {
    if (btnFormat24h && btnFormat12h) {
      if (timeFormat === '24h') {
        btnFormat24h.classList.add('active');
        btnFormat12h.classList.remove('active');
      } else {
        btnFormat12h.classList.add('active');
        btnFormat24h.classList.remove('active');
      }
    }

    if (btnModeSmooth && btnModeTick) {
      if (secondMode === 'smooth') {
        btnModeSmooth.classList.add('active');
        btnModeTick.classList.remove('active');
      } else {
        btnModeTick.classList.add('active');
        btnModeSmooth.classList.remove('active');
      }
    }
  }

  applyClockSettings();

  if (btnFormat24h) {
    btnFormat24h.addEventListener('click', () => {
      timeFormat = '24h';
      localStorage.setItem('yc-time-format', '24h');
      applyClockSettings();
    });
  }

  if (btnFormat12h) {
    btnFormat12h.addEventListener('click', () => {
      timeFormat = '12h';
      localStorage.setItem('yc-time-format', '12h');
      applyClockSettings();
    });
  }

  if (btnModeSmooth) {
    btnModeSmooth.addEventListener('click', () => {
      secondMode = 'smooth';
      localStorage.setItem('yc-second-mode', 'smooth');
      applyClockSettings();
    });
  }

  if (btnModeTick) {
    btnModeTick.addEventListener('click', () => {
      secondMode = 'tick';
      localStorage.setItem('yc-second-mode', 'tick');
      applyClockSettings();
    });
  }

  function getFormattedTzOffset(date) {
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const mins = String(absMinutes % 60).padStart(2, '0');
    return `UTC${sign}${hours}:${mins}`;
  }

  function formatLocalISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const tzOffset = getFormattedTzOffset(date);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzOffset.replace('UTC', '')}`;
  }

  let lastSecondRecorded = -1;

  function updateLowFrequencyTime(now) {
    const weekDaysZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const formattedZh = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDaysZh[now.getDay()]}`;
    if (dateString) dateString.textContent = formattedZh;

    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedEn = `${enDays[now.getDay()]}, ${enMonths[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    if (enDateString) enDateString.textContent = formattedEn;

    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei';
    const tzOffset = getFormattedTzOffset(now);
    if (timezoneString) timezoneString.textContent = `${tzOffset} (${tzName})`;

    if (unixTimestamp) unixTimestamp.textContent = Math.floor(now.getTime() / 1000);
    if (isoTimestamp) isoTimestamp.textContent = formatLocalISO(now);

    const elapsedSeconds = Math.floor((Date.now() - pageStartTime) / 1000);
    if (sessionUptimeCounter) {
      if (elapsedSeconds < 60) {
        sessionUptimeCounter.textContent = `${elapsedSeconds} 秒`;
      } else {
        const m = Math.floor(elapsedSeconds / 60);
        const s = elapsedSeconds % 60;
        sessionUptimeCounter.textContent = `${m} 分 ${s} 秒`;
      }
    }

    function formatTz(tz) {
      try {
        return new Intl.DateTimeFormat('zh-TW', {
          timeZone: tz,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }).format(now);
      } catch (e) {
        return '--:--';
      }
    }

    if (wcTaipei) wcTaipei.textContent = formatTz('Asia/Taipei');
    if (wcTokyo) wcTokyo.textContent = formatTz('Asia/Tokyo');
    if (wcLondon) wcLondon.textContent = formatTz('Europe/London');
    if (wcNy) wcNy.textContent = formatTz('America/New_York');
    if (wcSf) wcSf.textContent = formatTz('America/Los_Angeles');
  }

  function clockRenderLoop() {
    const now = new Date();
    const rawH = now.getHours();
    const rawM = now.getMinutes();
    const rawS = now.getSeconds();
    const rawMs = now.getMilliseconds();

    if (rawS !== lastSecondRecorded) {
      lastSecondRecorded = rawS;
      updateLowFrequencyTime(now);
    }

    let displayH = rawH;
    let meridiemText = '24H';

    if (timeFormat === '12h') {
      displayH = rawH % 12 || 12;
      meridiemText = rawH >= 12 ? '下午' : '上午';
    }

    const hStr = String(displayH).padStart(2, '0');
    const mStr = String(rawM).padStart(2, '0');
    const sStr = String(rawS).padStart(2, '0');
    const msStr = '.' + String(rawMs).padStart(3, '0');

    if (headerLiveTime) {
      headerLiveTime.textContent = `${String(rawH).padStart(2, '0')}:${mStr}:${sStr}`;
    }

    if (clockHours) clockHours.textContent = hStr;
    if (clockMinutes) clockMinutes.textContent = mStr;
    if (clockSeconds) clockSeconds.textContent = sStr;
    if (clockMs) clockMs.textContent = msStr;
    if (clockMeridiem) clockMeridiem.textContent = meridiemText;

    let effSec = rawS;
    if (secondMode === 'smooth') {
      effSec = rawS + rawMs / 1000;
    }

    const minFraction = rawM + effSec / 60;
    const hourFraction = (rawH % 12) + minFraction / 60;

    const secAngle = effSec * 6;
    const minAngle = minFraction * 6;
    const hourAngle = hourFraction * 30;

    if (analogHourHand) analogHourHand.setAttribute('transform', `rotate(${hourAngle.toFixed(2)} 100 100)`);
    if (analogMinuteHand) analogMinuteHand.setAttribute('transform', `rotate(${minAngle.toFixed(2)} 100 100)`);
    if (analogSecondHandGroup) analogSecondHandGroup.setAttribute('transform', `rotate(${secAngle.toFixed(2)} 100 100)`);

    requestAnimationFrame(clockRenderLoop);
  }

  requestAnimationFrame(clockRenderLoop);

  /* ==========================================================================
     5. 番茄鐘專注計時器 (Pomodoro Focus Timer)
     ========================================================================== */
  const pomoDisplay = document.getElementById('pomo-display');
  const pomoProgressCircle = document.getElementById('pomo-progress-circle');
  const pomoStageLabel = document.getElementById('pomo-stage-label');
  const pomoToggleBtn = document.getElementById('pomo-toggle-btn');
  const pomoToggleText = document.getElementById('pomo-toggle-text');
  const pomoToggleIcon = document.getElementById('pomo-toggle-icon');
  const pomoResetBtn = document.getElementById('pomo-reset-btn');
  const pomoSoundBtn = document.getElementById('pomo-sound-btn');
  const pomoCyclesCount = document.getElementById('pomo-cycles-count');
  const pomoModeButtons = document.querySelectorAll('.pomo-mode-btn');

  const RING_CIRCUMFERENCE = 660; // 2 * PI * 105 ≈ 660

  let pomoDuration = 25 * 60; // 秒
  let pomoRemaining = pomoDuration;
  let pomoRunning = false;
  let pomoInterval = null;
  let completedCycles = 0;
  let pomoType = 'work'; // 'work' | 'short' | 'long'

  function updatePomoDisplay() {
    const mins = Math.floor(pomoRemaining / 60);
    const secs = pomoRemaining % 60;
    if (pomoDisplay) {
      pomoDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    if (pomoProgressCircle) {
      const progressFraction = (pomoDuration - pomoRemaining) / pomoDuration;
      const offset = RING_CIRCUMFERENCE * (1 - progressFraction);
      pomoProgressCircle.style.strokeDashoffset = offset;
    }
  }

  function setPomoMode(type, minutes) {
    pomoType = type;
    pomoDuration = minutes * 60;
    pomoRemaining = pomoDuration;
    pausePomo();

    pomoModeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-pomo-type') === type);
    });

    if (pomoStageLabel) {
      if (type === 'work') {
        pomoStageLabel.textContent = '專注中 · FOCUS';
        pomoStageLabel.style.color = 'var(--accent-cyan)';
        if (pomoProgressCircle) pomoProgressCircle.style.stroke = 'var(--accent-cyan)';
      } else if (type === 'short') {
        pomoStageLabel.textContent = '短暫休息 · SHORT BREAK';
        pomoStageLabel.style.color = 'var(--accent-emerald)';
        if (pomoProgressCircle) pomoProgressCircle.style.stroke = 'var(--accent-emerald)';
      } else {
        pomoStageLabel.textContent = '深度放鬆 · LONG BREAK';
        pomoStageLabel.style.color = 'var(--accent-purple)';
        if (pomoProgressCircle) pomoProgressCircle.style.stroke = 'var(--accent-purple)';
      }
    }

    updatePomoDisplay();
  }

  pomoModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-pomo-type');
      const mins = parseInt(btn.getAttribute('data-minutes'), 10) || 25;
      setPomoMode(type, mins);
    });
  });

  function startPomo() {
    if (pomoRunning) return;
    pomoRunning = true;
    if (pomoToggleText) pomoToggleText.textContent = '暫停計時';
    if (pomoToggleIcon) pomoToggleIcon.textContent = '⏸';

    pomoInterval = setInterval(() => {
      if (pomoRemaining > 0) {
        pomoRemaining -= 1;
        updatePomoDisplay();
      } else {
        // 計時結束
        pausePomo();
        playSoftChime();
        if (pomoType === 'work') {
          completedCycles += 1;
          if (pomoCyclesCount) pomoCyclesCount.textContent = `${completedCycles} 次 🍅`;
          setPomoMode('short', 5);
        } else {
          setPomoMode('work', 25);
        }
      }
    }, 1000);
  }

  function pausePomo() {
    pomoRunning = false;
    if (pomoInterval) clearInterval(pomoInterval);
    pomoInterval = null;
    if (pomoToggleText) pomoToggleText.textContent = pomoRemaining === pomoDuration ? '開始專注' : '繼續計時';
    if (pomoToggleIcon) pomoToggleIcon.textContent = '▶';
  }

  if (pomoToggleBtn) {
    pomoToggleBtn.addEventListener('click', () => {
      if (pomoRunning) {
        pausePomo();
      } else {
        startPomo();
      }
    });
  }

  if (pomoResetBtn) {
    pomoResetBtn.addEventListener('click', () => {
      pausePomo();
      pomoRemaining = pomoDuration;
      updatePomoDisplay();
    });
  }

  if (pomoSoundBtn) {
    pomoSoundBtn.addEventListener('click', () => {
      playSoftChime();
    });
  }

  updatePomoDisplay();

  /* ==========================================================================
     6. 跨時區會議換算器 (World Meeting Planner)
     ========================================================================== */
  const plannerSlider = document.getElementById('planner-slider');
  const plannerSelectedTime = document.getElementById('planner-selected-time');
  const plannerCardsContainer = document.getElementById('planner-cards-container');
  const plannerResetBtn = document.getElementById('planner-reset-btn');

  const CITIES_METADATA = [
    { name: '台北 / 台灣 (基準)', zone: 'UTC+8', offsetHours: 8, isBase: true },
    { name: '東京 / 日本', zone: 'UTC+9', offsetHours: 9 },
    { name: '倫敦 / 英國', zone: 'UTC+1', offsetHours: 1 },
    { name: '紐約 / 美國東部', zone: 'UTC-4', offsetHours: -4 },
    { name: '舊金山 / 矽谷', zone: 'UTC-7', offsetHours: -7 }
  ];

  function formatHour12(hour) {
    const period = hour >= 12 ? '下午' : '上午';
    const h12 = hour % 12 || 12;
    return `${period} ${String(h12).padStart(2, '0')}:00`;
  }

  function renderPlanner(baseHour) {
    if (plannerSelectedTime) {
      plannerSelectedTime.textContent = `${String(baseHour).padStart(2, '0')}:00 (${formatHour12(baseHour)})`;
    }

    if (!plannerCardsContainer) return;
    plannerCardsContainer.innerHTML = '';

    CITIES_METADATA.forEach(city => {
      // 依相對於台北 (UTC+8) 的時差計算
      const diffFromTaipei = city.offsetHours - 8;
      let cityHour = (baseHour + diffFromTaipei) % 24;
      let dayIndicator = '';

      if (baseHour + diffFromTaipei >= 24) {
        dayIndicator = '+1天 (翌日)';
      } else if (baseHour + diffFromTaipei < 0) {
        cityHour = (cityHour + 24) % 24;
        dayIndicator = '-1天 (前日)';
      }

      // 標準工作窗口判定：09:00 ~ 18:00
      const isWorkingHour = cityHour >= 9 && cityHour <= 18;
      const isNight = cityHour >= 22 || cityHour < 7;

      const card = document.createElement('div');
      card.className = `planner-city-card ${isWorkingHour ? 'working' : ''}`;

      card.innerHTML = `
        <div class="p-card-top">
          <span class="p-card-name">${city.name}</span>
          <span class="p-card-zone">${city.zone}</span>
        </div>
        <div class="p-card-time">
          ${String(cityHour).padStart(2, '0')}:00
        </div>
        <div class="p-card-bottom">
          <span class="p-card-state-pill ${isWorkingHour ? 'open' : 'closed'}">
            ${isWorkingHour ? '🟢 工作時間 (09-18)' : (isNight ? '🌙 深夜休息' : '⚪ 非工作時間')}
            ${dayIndicator ? ` · ${dayIndicator}` : ''}
          </span>
        </div>
      `;

      plannerCardsContainer.appendChild(card);
    });
  }

  // 初始滑桿設定為當前本地小時
  const currentHour = new Date().getHours();
  if (plannerSlider) {
    plannerSlider.value = currentHour;
    plannerSlider.addEventListener('input', (e) => {
      renderPlanner(parseInt(e.target.value, 10));
    });
  }

  if (plannerResetBtn) {
    plannerResetBtn.addEventListener('click', () => {
      const nowH = new Date().getHours();
      if (plannerSlider) plannerSlider.value = nowH;
      renderPlanner(nowH);
    });
  }

  renderPlanner(currentHour);

  /* ==========================================================================
     7. 剪貼簿快速複製工具
     ========================================================================== */
  const copyFileBtn = document.getElementById('copy-file-btn');
  const copyTooltip = document.getElementById('copy-tooltip');

  if (copyFileBtn) {
    copyFileBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(activeFilename);
        if (copyTooltip) {
          copyTooltip.classList.add('show');
          setTimeout(() => copyTooltip.classList.remove('show'), 2000);
        }
      } catch (err) {
        console.warn('複製失敗', err);
      }
    });
  }

  const copyUnixBtn = document.getElementById('copy-unix-btn');
  if (copyUnixBtn) {
    copyUnixBtn.addEventListener('click', async () => {
      const val = Math.floor(Date.now() / 1000);
      try {
        await navigator.clipboard.writeText(String(val));
        copyUnixBtn.textContent = '已複製';
        copyUnixBtn.classList.add('copied');
        setTimeout(() => {
          copyUnixBtn.textContent = '複製';
          copyUnixBtn.classList.remove('copied');
        }, 1800);
      } catch (e) {
        console.warn(e);
      }
    });
  }

  const copyIsoBtn = document.getElementById('copy-iso-btn');
  if (copyIsoBtn) {
    copyIsoBtn.addEventListener('click', async () => {
      const val = formatLocalISO(new Date());
      try {
        await navigator.clipboard.writeText(val);
        copyIsoBtn.textContent = '已複製';
        copyIsoBtn.classList.add('copied');
        setTimeout(() => {
          copyIsoBtn.textContent = '複製';
          copyIsoBtn.classList.remove('copied');
        }, 1800);
      } catch (e) {
        console.warn(e);
      }
    });
  }

  /* ==========================================================================
     8. 視覺主題切換與 Ping 按鈕
     ========================================================================== */
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');

  const savedTheme = localStorage.getItem('yc-theme');
  if (savedTheme === 'aurora') {
    document.body.classList.add('theme-aurora');
    if (themeIcon) themeIcon.textContent = '🌌';
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isAurora = document.body.classList.toggle('theme-aurora');
      localStorage.setItem('yc-theme', isAurora ? 'aurora' : 'space');
      if (themeIcon) themeIcon.textContent = isAurora ? '🌌' : '🔮';
    });
  }

  const pingAlertBtn = document.getElementById('ping-alert-btn');
  const pingCount = document.getElementById('ping-count');
  let pings = 0;

  if (pingAlertBtn && pingCount) {
    pingAlertBtn.addEventListener('click', () => {
      pings += 1;
      pingCount.textContent = pings;
      pingAlertBtn.style.transform = 'scale(0.95)';
      setTimeout(() => pingAlertBtn.style.transform = '', 150);
    });
  }
});
