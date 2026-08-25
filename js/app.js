/**
 * Korean Learning Type - App orchestration
 * State, screen flow, rendering. No backend, no external calls.
 */

(function () {
  "use strict";

  const state = {
    nickname: "",
    flow: QUESTIONS.slice(), // grows with tie-breaker questions if needed
    currentIndex: 0,
    answers: {}, // { [questionId]: "E"|"I"|... }
    scores: null,
    percentages: null,
    tiedAxes: [],
    tieIndex: 0,
    finalType: null,
    strongestPreference: null,
    soundEnabled: true,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    challengeStarted: false,
  };

  // ------------------------------ DOM refs ------------------------------

  const el = {};
  function cacheDom() {
    [
      "screen-landing", "screen-chapter", "screen-question", "screen-analysis", "screen-result",
      "sound-toggle", "sound-toggle-2", "nickname-input", "start-btn", "school-branding",
      "chapter-emoji", "chapter-title", "chapter-msg-ko", "chapter-msg-en", "chapter-continue-btn",
      "back-btn", "chapter-tag", "question-counter", "progress-bar", "progress-fill",
      "context-emoji", "context-time", "question-prompt", "question-prompt-en",
      "option-a", "option-a-text", "option-a-text-en", "option-b", "option-b-text", "option-b-text-en",
      "reaction-toast", "analysis-title", "analysis-steps",
      "result-emoji", "result-code", "result-title", "result-title-en", "result-tagline",
      "axis-chart", "result-description", "result-description-en", "result-strengths", "result-cautions",
      "result-best-methods", "result-skills", "difficult-title", "result-difficult", "result-alternative",
      "strongest-title", "result-strongest", "result-content", "result-mission",
      "challenge-start-btn", "challenge-list", "result-buddy", "result-combo", "result-meme",
      "share-canvas", "share-preview", "save-btn", "share-btn", "copy-link-btn", "restart-btn",
      "live-region",
    ].forEach((id) => {
      el[toCamel(id)] = document.getElementById(id);
    });
  }
  function toCamel(id) {
    return id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  }

  // ------------------------------ Sound (Web Audio, no assets needed) ------------------------------

  let audioCtx = null;
  function beep(freq, duration, type = "sine", volume = 0.08) {
    if (!state.soundEnabled) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      /* Web Audio unavailable — silently skip */
    }
  }
  const Sound = {
    select: () => beep(660, 0.12, "sine", 0.06),
    advance: () => beep(880, 0.1, "triangle", 0.05),
    chapterDone: () => { beep(523, 0.15); setTimeout(() => beep(784, 0.2), 120); },
    reveal: () => { beep(660, 0.12); setTimeout(() => beep(880, 0.14), 130); setTimeout(() => beep(1046, 0.22), 260); },
  };

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    Storage.setSoundEnabled(state.soundEnabled);
    updateSoundButtons();
  }
  function updateSoundButtons() {
    const icon = state.soundEnabled ? "🔊" : "🔇";
    [el.soundToggle, el.soundToggle2].forEach((btn) => {
      if (!btn) return;
      btn.textContent = icon;
      btn.setAttribute("aria-pressed", String(state.soundEnabled));
    });
  }

  // ------------------------------ Screen switching ------------------------------

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("screen--active"));
    document.getElementById(id).classList.add("screen--active");
    document.getElementById(id).scrollTop = 0;
    window.scrollTo({ top: 0, behavior: state.reducedMotion ? "auto" : "smooth" });
  }

  function announce(msg) {
    if (el.liveRegion) el.liveRegion.textContent = msg;
  }

  // ------------------------------ Landing ------------------------------

  function initLanding() {
    el.nicknameInput.value = Storage.getNickname();
    state.soundEnabled = Storage.getSoundEnabled();
    updateSoundButtons();
    if (SCHOOL_BRAND_NAME) el.schoolBranding.textContent = SCHOOL_BRAND_NAME;

    el.startBtn.addEventListener("click", startQuiz);
    el.soundToggle.addEventListener("click", toggleSound);
    el.soundToggle2.addEventListener("click", toggleSound);
    el.nicknameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startQuiz();
    });
    el.backBtn.addEventListener("click", goBack);
    el.optionA.addEventListener("click", () => selectAnswer("A"));
    el.optionB.addEventListener("click", () => selectAnswer("B"));
    el.chapterContinueBtn.addEventListener("click", onChapterContinue);
    el.challengeStartBtn.addEventListener("click", renderChallenge);
    el.saveBtn.addEventListener("click", onSave);
    el.shareBtn.addEventListener("click", onShare);
    el.copyLinkBtn.addEventListener("click", onCopyLink);
    el.restartBtn.addEventListener("click", restartQuiz);
  }

  const SCHOOL_BRAND_NAME = "SEOULTECH"; // configurable campus brand — set to "" to hide

  function startQuiz() {
    state.nickname = el.nicknameInput.value.trim().slice(0, 12);
    Storage.setNickname(state.nickname);
    state.currentIndex = 0;
    renderChapterIntro(CHAPTERS[0], () => {
      showScreen("screen-question");
      renderQuestion();
    });
  }

  // ------------------------------ Chapter transitions ------------------------------

  let pendingChapterCallback = null;

  function renderChapterIntro(chapter, onContinue) {
    el.chapterEmoji.textContent = chapter.emoji;
    el.chapterTitle.textContent = `${chapter.titleKo} · ${chapter.titleEn}`;
    el.chapterMsgKo.textContent = chapter.introKo;
    el.chapterMsgEn.textContent = chapter.introEn;
    pendingChapterCallback = onContinue;
    showScreen("screen-chapter");
  }

  function renderChapterOutro(chapter, onContinue) {
    Sound.chapterDone();
    el.chapterEmoji.textContent = chapter.outroEmoji;
    el.chapterTitle.textContent = chapter.outroKo;
    el.chapterMsgKo.textContent = chapter.outroKo;
    el.chapterMsgEn.textContent = chapter.outroEn;
    pendingChapterCallback = onContinue;
    showScreen("screen-chapter");
  }

  function renderTieIntro(onContinue) {
    el.chapterEmoji.textContent = "🔥";
    el.chapterTitle.textContent = "TOO CLOSE!";
    el.chapterMsgKo.textContent = "두 학습 스타일이 초박빙이에요. 마지막 몇 문제!";
    el.chapterMsgEn.textContent = "Two learning styles are neck and neck. A few final questions!";
    pendingChapterCallback = onContinue;
    showScreen("screen-chapter");
  }

  function onChapterContinue() {
    const cb = pendingChapterCallback;
    pendingChapterCallback = null;
    if (cb) cb();
  }

  // ------------------------------ Question rendering ------------------------------

  function currentQuestion() {
    return state.flow[state.currentIndex];
  }

  function renderQuestion() {
    const q = currentQuestion();
    if (!q) return;

    const isTie = String(q.id).startsWith("TB-");
    const chapter = isTie ? null : CHAPTERS.find((c) => c.id === q.chapter);

    el.chapterTag.textContent = isTie ? "🔥 TIE BREAKER" : `${chapter.emoji} ${chapter.titleEn}`;
    el.questionCounter.textContent = isTie
      ? `Tie Breaker ${state.tieIndex + 1} / ${state.tiedAxes.length}`
      : `Question ${q.id} / 24`;

    const progressPct = isTie ? 100 : Math.round(((q.id - 1) / 24) * 100);
    el.progressFill.style.width = `${progressPct}%`;
    el.progressBar.setAttribute("aria-valuenow", String(progressPct));

    el.contextEmoji.textContent = q.context.emoji;
    el.contextTime.textContent = isTie ? q.context.timeKo : `${q.context.timeKo}`;

    el.questionPrompt.textContent = q.promptKo;
    el.questionPromptEn.textContent = q.promptEn;

    el.optionAText.textContent = q.optionA.textKo;
    el.optionATextEn.textContent = q.optionA.textEn;
    el.optionBText.textContent = q.optionB.textKo;
    el.optionBTextEn.textContent = q.optionB.textEn;

    el.optionA.classList.remove("is-selected");
    el.optionB.classList.remove("is-selected");

    const existing = isTie ? state.tieAnswers && state.tieAnswers[q.axis] : state.answers[q.id];
    if (existing === q.optionA.value) el.optionA.classList.add("is-selected");
    if (existing === q.optionB.value) el.optionB.classList.add("is-selected");

    el.backBtn.style.visibility = state.currentIndex === 0 ? "hidden" : "visible";

    announce(`${q.promptKo}`);
  }

  function showReaction(text) {
    if (!text) return;
    el.reactionToast.textContent = text;
    el.reactionToast.classList.add("is-visible");
    setTimeout(() => el.reactionToast.classList.remove("is-visible"), 1400);
  }

  function selectAnswer(choice) {
    const q = currentQuestion();
    const isTie = String(q.id).startsWith("TB-");
    const option = choice === "A" ? q.optionA : q.optionB;
    const reaction = choice === "A" ? q.reactionA : q.reactionB;

    Sound.select();

    if (isTie) {
      state.tieAnswers = state.tieAnswers || {};
      state.tieAnswers[q.axis] = option.value;
    } else {
      state.answers[q.id] = option.value;
    }

    el.optionA.classList.toggle("is-selected", choice === "A");
    el.optionB.classList.toggle("is-selected", choice === "B");

    if (reaction) showReaction(reaction);

    const delay = reaction ? 900 : 350;
    setTimeout(() => advance(isTie), delay);
  }

  function advance(wasTie) {
    Sound.advance();
    if (wasTie) {
      state.tieIndex += 1;
      if (state.tieIndex >= state.tiedAxes.length) {
        goToAnalysis();
        return;
      }
      state.currentIndex += 1;
      renderQuestion();
      return;
    }

    const q = currentQuestion();

    if (q.id === 8) {
      state.currentIndex += 1;
      renderChapterOutroThenIntro(CHAPTERS[0], CHAPTERS[1]);
      return;
    }
    if (q.id === 16) {
      state.currentIndex += 1;
      renderChapterOutroThenIntro(CHAPTERS[1], CHAPTERS[2]);
      return;
    }
    if (q.id === 24) {
      finishMainQuestions();
      return;
    }

    state.currentIndex += 1;
    renderQuestion();
  }

  function renderChapterOutroThenIntro(prevChapter, nextChapter) {
    renderChapterOutro(prevChapter, () => {
      renderChapterIntro(nextChapter, () => {
        showScreen("screen-question");
        renderQuestion();
      });
    });
  }

  function goBack() {
    if (state.currentIndex === 0) return;
    state.currentIndex -= 1;
    const q = currentQuestion();
    const isTie = String(q.id).startsWith("TB-");
    if (isTie) {
      state.tieIndex = Math.max(0, state.tieIndex - 1);
    }
    renderQuestion();
  }

  // ------------------------------ End of main questions / tie-break ------------------------------

  function finishMainQuestions() {
    const scores = calculateScores(state.answers);
    const ties = detectTies(scores);
    state.scores = scores;
    state.tiedAxes = ties;

    if (ties.length === 0) {
      goToAnalysis();
      return;
    }

    state.tieIndex = 0;
    state.tieAnswers = {};
    ties.forEach((axisKey) => {
      state.flow.push(TIEBREAKER_QUESTIONS[axisKey]);
    });
    state.currentIndex += 1; // move past Q24 into first tie-breaker slot

    renderTieIntro(() => {
      showScreen("screen-question");
      renderQuestion();
    });
  }

  // ------------------------------ Analysis ------------------------------

  const ANALYSIS_STEPS = [
    "💬 사람과 배우는 방식 분석 중...",
    "🔎 표현을 이해하는 방식 분석 중...",
    "❤️ 소통 스타일 분석 중...",
    "📅 학습 계획 스타일 분석 중...",
  ];

  function goToAnalysis() {
    showScreen("screen-analysis");
    el.analysisSteps.innerHTML = "";
    const stepEls = ANALYSIS_STEPS.map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      el.analysisSteps.appendChild(li);
      return li;
    });

    const stepDelay = state.reducedMotion ? 80 : 550;
    stepEls.forEach((li, i) => {
      setTimeout(() => li.classList.add("is-visible"), i * stepDelay);
    });

    const totalDelay = stepDelay * stepEls.length + (state.reducedMotion ? 200 : 700);
    setTimeout(computeAndShowResult, totalDelay);
  }

  // ------------------------------ Result computation & rendering ------------------------------

  function computeAndShowResult() {
    const percentages = calculatePercentages(state.scores);
    const finalType = determineFinalType(state.scores, state.tieAnswers || {});
    const strongest = determineStrongestPreference(finalType, percentages);

    state.percentages = percentages;
    state.finalType = finalType;
    state.strongestPreference = strongest;

    renderResult();
    Sound.reveal();
    showScreen("screen-result");
  }

  const AXIS_META = {
    EI: { leftLabel: "PEOPLE", rightLabel: "FOCUS" },
    SN: { leftLabel: "PRACTICE", rightLabel: "IDEAS" },
    TF: { leftLabel: "LOGIC", rightLabel: "HEART" },
    JP: { leftLabel: "PLAN", rightLabel: "FLEX" },
  };

  function renderResult() {
    const profile = PROFILES[state.finalType];
    const pct = state.percentages;

    el.resultEmoji.textContent = profile.emoji;
    el.resultCode.textContent = profile.code;
    el.resultTitle.textContent = profile.titleKo;
    el.resultTitleEn.textContent = profile.titleEn;
    el.resultTagline.textContent = profile.taglineKo;

    // Axis chart
    el.axisChart.innerHTML = "";
    AXES.forEach(({ key, left, right }) => {
      const winner = state.finalType.includes(left) ? left : right;
      const meta = AXIS_META[key];
      const label = winner === left ? meta.leftLabel : meta.rightLabel;
      const value = pct[key][winner];

      const row = document.createElement("div");
      row.className = "axis-row";
      row.innerHTML = `
        <div class="axis-row__labels"><span>${label}</span><span>${value}%</span></div>
        <div class="axis-row__track"><div class="axis-row__fill" style="width:${value}%"></div></div>
      `;
      el.axisChart.appendChild(row);
    });

    el.resultDescription.textContent = profile.descriptionKo;
    el.resultDescriptionEn.textContent = profile.descriptionEn;

    fillBulletList(el.resultStrengths, profile.strengths);
    fillBulletList(el.resultCautions, profile.cautions);
    fillNumberedList(el.resultBestMethods, profile.bestMethods);

    el.resultSkills.innerHTML = "";
    const skillLabels = { listening: "🎧 Listening", speaking: "🗣 Speaking", reading: "📖 Reading", writing: "✍️ Writing" };
    Object.keys(skillLabels).forEach((key) => {
      const skill = profile.skills[key];
      const div = document.createElement("div");
      div.className = "skill-item";
      div.innerHTML = `
        <span class="skill-item__label">${skillLabels[key]}</span>
        <p class="skill-item__text">${skill.ko}</p>
        <p class="skill-item__text-en">${skill.en}</p>
      `;
      el.resultSkills.appendChild(div);
    });

    el.difficultTitle.textContent = `😵 ${profile.difficultMethod.titleKo}`;
    el.resultDifficult.textContent = profile.difficultMethod.ko;
    el.resultAlternative.textContent = profile.alternativeMethod.ko;

    const sp = state.strongestPreference;
    const advice = STRONGEST_ADVICE[sp.letter];
    el.strongestTitle.textContent = `${advice.emoji} Your Superpower: ${advice.labelEn} (${sp.pct}%)`;
    el.resultStrongest.textContent = advice.ko;

    fillBulletList(el.resultContent, profile.contentRecommendations);

    el.resultMission.textContent = profile.campusMission.ko;

    el.resultBuddy.textContent = `${state.finalType} × ${profile.studyBuddy.code}\n${profile.studyBuddy.ko}`;
    el.resultCombo.textContent = `${state.finalType} × ${profile.funCombo.code}\n${profile.funCombo.ko}`;

    el.resultMeme.textContent = profile.meme.ko;

    // Reset challenge section
    el.challengeList.classList.add("is-hidden");
    el.challengeList.innerHTML = "";
    el.challengeStartBtn.style.display = "inline-flex";
    state.challengeStarted = false;
  }

  function fillBulletList(listEl, items) {
    listEl.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `${item.ko}<span class="en">${item.en}</span>`;
      listEl.appendChild(li);
    });
  }
  function fillNumberedList(listEl, items) {
    fillBulletList(listEl, items);
  }

  function renderChallenge() {
    const profile = PROFILES[state.finalType];
    state.challengeStarted = true;
    el.challengeStartBtn.style.display = "none";
    el.challengeList.classList.remove("is-hidden");
    el.challengeList.innerHTML = "";
    profile.challenge7Days.forEach((day) => {
      const li = document.createElement("li");
      li.className = "challenge-item";
      const checkboxId = `challenge-day-${day.day}`;
      li.innerHTML = `
        <input type="checkbox" id="${checkboxId}" />
        <label for="${checkboxId}">
          <span class="challenge-item__day">DAY ${day.day}</span>
          <span class="challenge-item__ko">${day.ko}</span><br />
          <span class="challenge-item__en">${day.en}</span>
        </label>
      `;
      const checkbox = li.querySelector("input");
      checkbox.addEventListener("change", () => {
        li.classList.toggle("is-done", checkbox.checked);
      });
      el.challengeList.appendChild(li);
    });
  }

  // ------------------------------ Share / Save / Restart ------------------------------

  function buildShareContext() {
    return {
      profile: PROFILES[state.finalType],
      finalType: state.finalType,
      percentages: state.percentages,
      nickname: state.nickname,
    };
  }

  function ensureShareCanvasDrawn() {
    drawShareCard(el.shareCanvas, buildShareContext());
  }

  async function onSave() {
    ensureShareCanvasDrawn();
    el.shareCanvas.classList.remove("is-hidden");
    el.sharePreview.src = el.shareCanvas.toDataURL("image/png");
    el.sharePreview.classList.remove("is-hidden");
    el.shareCanvas.classList.add("is-hidden");
    await downloadShareCard(el.shareCanvas, `korean-learning-type-${state.finalType}.png`);
    announce("결과 카드가 저장되었습니다.");
  }

  async function onShare() {
    ensureShareCanvasDrawn();
    const profile = PROFILES[state.finalType];
    const text = `저는 한국어 학습 유형 테스트에서 ${profile.emoji} ${state.finalType} (${profile.titleKo})가 나왔어요! 너도 해볼래?`;
    const result = await shareResultCard(el.shareCanvas, { text });
    if (result.method === "unsupported") {
      const copied = await copyResultLink(text);
      announce(copied ? "공유 기능이 지원되지 않아 링크를 복사했습니다." : "공유에 실패했습니다.");
    }
  }

  async function onCopyLink() {
    const profile = PROFILES[state.finalType];
    const text = `저는 한국어 학습 유형 테스트에서 ${profile.emoji} ${state.finalType} (${profile.titleKo})가 나왔어요!`;
    const ok = await copyResultLink(text);
    announce(ok ? "링크가 복사되었습니다." : "복사에 실패했습니다. 직접 복사해주세요.");
  }

  function restartQuiz() {
    state.currentIndex = 0;
    state.answers = {};
    state.tieAnswers = {};
    state.tiedAxes = [];
    state.tieIndex = 0;
    state.scores = null;
    state.percentages = null;
    state.finalType = null;
    state.strongestPreference = null;
    state.flow = QUESTIONS.slice();
    showScreen("screen-landing");
  }

  // ------------------------------ Init ------------------------------

  function initApp() {
    cacheDom();
    initLanding();
    updateSoundButtons();
  }

  document.addEventListener("DOMContentLoaded", initApp);
})();
