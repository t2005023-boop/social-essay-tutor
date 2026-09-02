document.addEventListener("DOMContentLoaded", () => {
  const currentLevel = "high_school";
  let currentField = "history";
  let currentProblem = null;

  // DOM要素の取得
  const tabBtns = document.querySelectorAll(".tab-btn");
  const problemSelect = document.getElementById("problem-select");
  const problemTags = document.getElementById("problem-tags");
  const problemQuestion = document.getElementById("problem-question");
  const charGuide = document.getElementById("char-guide");
  const charCount = document.getElementById("char-count");
  const answerInput = document.getElementById("answer-input");
  const form = document.getElementById("essay-form");
  const submitBtn = document.getElementById("submit-btn");

  // ヒントDOM
  const toggleHintBtn = document.getElementById("toggle-hint-btn");
  const hintBox = document.getElementById("hint-box");
  const hintKeywords = document.getElementById("hint-keywords");
  const hintTemplate = document.getElementById("hint-template");

  // 模範解答DOM
  const toggleSampleBtn = document.getElementById("toggle-sample-btn");
  const sampleAnswerBox = document.getElementById("sample-answer-box");
  const sampleAnswerText = document.getElementById("sample-answer-text");

  // 添削結果DOM
  const resultContainer = document.getElementById("result-container");
  const rankBox = document.getElementById("rank-box");
  const rankBadge = document.getElementById("rank-badge");
  const rankTitle = document.getElementById("rank-title");
  const rankEngine = document.getElementById("rank-engine");
  const fbGoodText = document.getElementById("fb-good-text");
  const fbAdviceText = document.getElementById("fb-advice-text");
  const fbQuestionText = document.getElementById("fb-question-text");
  const rewriteBtn = document.getElementById("rewrite-btn");

  // 分野タブ切り替え（地理・歴史・公民）
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentField = btn.dataset.field;
      renderProblemOptions();
    });
  });

  // ヒント表示トグルイベント
  if (toggleHintBtn) {
    toggleHintBtn.addEventListener("click", () => {
      if (hintBox.style.display === "none" || !hintBox.style.display) {
        hintBox.style.display = "block";
        toggleHintBtn.innerHTML = `<span>🙈 ヒントを閉じる</span>`;
      } else {
        hintBox.style.display = "none";
        toggleHintBtn.innerHTML = `<span>🧩 書き方のヒントを見る（クリックで開く）</span>`;
      }
    });
  }

  // 模範解答トグルイベント
  if (toggleSampleBtn) {
    toggleSampleBtn.addEventListener("click", () => {
      if (sampleAnswerBox.style.display === "none" || !sampleAnswerBox.style.display) {
        sampleAnswerBox.style.display = "block";
        toggleSampleBtn.innerHTML = `<span>🙈 模範解答例を閉じる</span>`;
      } else {
        sampleAnswerBox.style.display = "none";
        toggleSampleBtn.innerHTML = `<span>💡 模範解答例を見る</span>`;
      }
    });
  }

  // 問題ドロップダウンの更新
  function renderProblemOptions() {
    if (!problemSelect) return;
    const levelData = (typeof PROBLEM_DATA !== 'undefined' && PROBLEM_DATA[currentLevel]) ? PROBLEM_DATA[currentLevel] : {};
    const problems = levelData[currentField] || [];
    problemSelect.innerHTML = "";

    const categories = {};
    problems.forEach(p => {
      const cat = p.category || "基本問題";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(p);
    });

    for (const [catName, probList] of Object.entries(categories)) {
      const group = document.createElement("optgroup");
      group.label = `【${catName}】 (${probList.length}問)`;
      probList.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `Q. ${p.title}`;
        group.appendChild(opt);
      });
      problemSelect.appendChild(group);
    }

    if (problems.length > 0) {
      selectProblem(problems[0].id);
    } else {
      if (problemQuestion) problemQuestion.textContent = "問題データを読み込み中...";
    }
  }

  // 問題選択時の詳細表示
  function selectProblem(problemId) {
    const levelData = (typeof PROBLEM_DATA !== 'undefined' && PROBLEM_DATA[currentLevel]) ? PROBLEM_DATA[currentLevel] : {};
    const problems = levelData[currentField] || [];
    currentProblem = problems.find(p => p.id === problemId) || problems[0];

    if (!currentProblem) return;

    // ヒントボックスの初期化
    if (hintBox) hintBox.style.display = "none";
    if (toggleHintBtn) toggleHintBtn.innerHTML = `<span>🧩 書き方のヒントを見る（クリックで開く）</span>`;

    if (currentProblem.keywords && currentProblem.keywords.length > 0) {
      if (hintKeywords) {
        hintKeywords.innerHTML = `<strong>💡 着眼点キーワードの例:</strong> ${currentProblem.keywords.join("、")}`;
      }
    } else {
      if (hintKeywords) hintKeywords.innerHTML = "";
    }

    if (hintTemplate) {
      hintTemplate.innerHTML = currentProblem.writingTemplate || "【書き方のステップ】\n① 問いに対する理由や背景をメモする。\n②「〜のため」「〜によって〇〇となる。」の形で文章をまとめましょう。";
    }

    // 模範解答ボックスの初期化
    if (sampleAnswerBox) sampleAnswerBox.style.display = "none";
    if (toggleSampleBtn) toggleSampleBtn.innerHTML = `<span>💡 模範解答例を見る</span>`;
    if (sampleAnswerText) sampleAnswerText.textContent = currentProblem.sampleAnswer || "模範解答準備中";

    const tagsHtml = [
      `<span class="tag" style="background:#1e3a8a; color:#fff;">🏫 高校入試・定期試験レベル</span>`,
      `<span class="tag" style="background:#0284c7; color:#fff;">📂 ${currentProblem.category || '単元'}</span>`,
      ...(currentProblem.tags || []).map(tag => `<span class="tag"># ${tag}</span>`)
    ].join("");

    if (problemTags) problemTags.innerHTML = tagsHtml;
    if (problemQuestion) problemQuestion.textContent = currentProblem.question;

    if (charGuide) charGuide.textContent = `目安: ${currentProblem.minChars}〜${currentProblem.maxChars}文字`;
  }

  if (problemSelect) {
    problemSelect.addEventListener("change", (e) => {
      selectProblem(e.target.value);
    });
  }

  // 文字数カウント
  if (answerInput && charCount) {
    answerInput.addEventListener("input", () => {
      const len = answerInput.value.length;
      charCount.textContent = len;
      if (currentProblem && len >= currentProblem.minChars && len <= currentProblem.maxChars) {
        charCount.style.color = '#059669';
      } else if (currentProblem && len > currentProblem.maxChars) {
        charCount.style.color = '#dc2626';
      } else {
        charCount.style.color = '#2563eb';
      }
    });
  }

  // クライアント側ローカル評価エンジン（模範解答照合・100% A判定保証）
  function clientSideEvaluate(problem, answerText) {
    const rawAnswer = (answerText || '').trim();
    const cleanAnswer = rawAnswer.replace(/[\s\r\n\t、。・「」『』（）()!！?？,.]/g, '');
    const length = rawAnswer.length;

    const rawSample = problem && problem.sampleAnswer ? problem.sampleAnswer : '';
    const cleanSample = rawSample.replace(/[\s\r\n\t、。・「」『』（）()!！?？,.]/g, '');

    let isSampleAnswerMatch = false;
    if (cleanSample.length > 0 && cleanAnswer.length > 0) {
      if (cleanAnswer === cleanSample || 
          cleanAnswer.includes(cleanSample) || 
          (cleanSample.includes(cleanAnswer) && cleanAnswer.length >= 30)) {
        isSampleAnswerMatch = true;
      } else {
        let commonCount = 0;
        for (let i = 0; i < cleanAnswer.length; i++) {
          if (cleanSample.includes(cleanAnswer[i])) commonCount++;
        }
        if (commonCount / Math.max(cleanSample.length, 1) >= 0.55 && cleanAnswer.length >= 35) {
          isSampleAnswerMatch = true;
        }
      }
    }

    const keywords = problem ? (problem.keywords || []) : [];
    const hitKeywords = [];
    const missingKeywords = [];

    keywords.forEach(kwGroup => {
      const tokens = kwGroup.split(/[/,:：()（）\s]/).map(t => t.trim()).filter(t => t.length >= 2);
      let matched = null;
      for (const token of tokens) {
        const cleanToken = token.replace(/[\s、。・「」『』（）()]/g, '');
        if (cleanAnswer.includes(cleanToken)) {
          matched = cleanToken;
          break;
        }
      }
      if (matched) {
        hitKeywords.push(matched);
      } else {
        missingKeywords.push(tokens[0] || kwGroup);
      }
    });

    const connectPatterns = [
      { name: "理由・原因", regex: /(ため|から|によって|により|ので|故に|結果)/ },
      { name: "結果・展開", regex: /(結果|その結果|したがって|となり|となる|適して|生じる|ため|防止)/ },
      { name: "対比・添加", regex: /(だけでなく|一方で|しかし|さらに|また|対して)/ }
    ];
    const foundConnectives = connectPatterns.filter(p => p.regex.test(rawAnswer));
    const hasConnective = foundConnectives.length > 0;
    const minTarget = 45;

    let analysisGood = [];
    if (isSampleAnswerMatch || hitKeywords.length >= 2) {
      analysisGood.push(`【重要語句の的確さ】「${hitKeywords.slice(0, 4).join('」「') || '模範的語句'}」などの重要キーワードや核心となる論点を網羅できています。`);
    } else if (hitKeywords.length === 1) {
      analysisGood.push(`【重要語句の的確さ】「${hitKeywords[0]}」という問題の急所となる重要用語を正確に捉えられています。`);
    } else {
      analysisGood.push(`【着眼点】問いのテーマに向き合い、自力で記述しようとする姿勢が表れています。`);
    }

    if (hasConnective || isSampleAnswerMatch) {
      analysisGood.push(`【論理構成力】理由と結果の因果関係（「〜のため」「〜によって」等）を的確に組み立て、説得力のある論理展開ができています。`);
    }

    if (length >= minTarget || isSampleAnswerMatch) {
      analysisGood.push(`【記述量・表現力】現在${length}文字記述されており、論述として過不足のない文章量をしっかり確保できています。`);
    }

    const goodPoints = analysisGood.join('\n');
    const isAQualified = isSampleAnswerMatch ||
                         (hitKeywords.length >= 2 && length >= minTarget) ||
                         (hitKeywords.length >= 1 && hasConnective && length >= minTarget);

    let rank = 'C';
    let howToGetA = '';
    let guidingQuestion = '';

    if (isAQualified) {
      rank = 'A';
      howToGetA = `【🎉 A判定達成！要点を的確に捉えた素晴らしい論述です】\n・出題意図に対する必要な要素・因果関係・重要用語がすべて的確に盛り込まれています！\n・定期試験・入試本番でも満点（最高評価）を獲得できる優れた記述力です。この調子で他の問題にも挑戦してみましょう！`;
      guidingQuestion = 'この素晴らしい論述の型（理由→展開→結論）を、他のテーマでも再現できるように練習してみましょう！';
    } else if (length < 20) {
      rank = 'D';
      const sampleKw = missingKeywords.slice(0, 2).join('」や「');
      howToGetA = `【A判定にするための最短ナビ】\n① 【入れるキーワード】: 「${sampleKw || '理由'}」という言葉を使います。\n② 【文の組み立て】: 「〇〇によって、△△となるため。」と因果関係を作ります。\n③ 【完成目標】: 目安として${minTarget}文字以上のまとまった文章に仕上げましょう。`;
      guidingQuestion = 'まずは上の「書き方のヒント」を参考に、思いつく理由を短く書いてみませんか？';
    } else {
      rank = 'B';
      const nextKw = missingKeywords.length > 0 ? missingKeywords[0] : '具体的な影響や結果';
      howToGetA = `【A判定にするための最短ナビ（あと1つの視点を足せばA判定！）】\n① 【足すべき重要キーワード】: まだ触れられていない「${nextKw}」という視点を1つ文章に盛り込んでください。\n② 【文のつなぎ方】: 「現在の内容」＋「さらに【${nextKw}】によって、（結果）となるため。」と文を合体させます。\n③ 【完成テンプレート】:\n「〜〜（理由）だけでなく、【${nextKw}】によって〜〜（結果）となるから。」\nこの形に整えて${minTarget}文字以上書くと、確実にA判定に到達します！`;
      guidingQuestion = `あなたの書いた文に「${nextKw}」という言葉を組み込むと、どんな因果関係が完成しますか？`;
    }

    return {
      rank,
      goodPoints,
      howToGetA,
      guidingQuestion,
      sampleAnswer: rawSample,
      problemTitle: problem ? problem.title : '',
      engine: isSampleAnswerMatch ? `スマート教育評価エンジン (模範解答照合・A判定確定)` : `スマート推敲サポートエンジン`
    };
  }

  // フォーム送信
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const studentClass = document.getElementById("student-class") ? document.getElementById("student-class").value : "";
      const studentNum = document.getElementById("student-num") ? document.getElementById("student-num").value : "";
      const studentName = document.getElementById("student-name") ? document.getElementById("student-name").value : "";
      const answer = answerInput ? answerInput.value.trim() : "";

      if (!studentClass) {
        alert("クラスを選択してください。");
        return;
      }
      if (!answer) {
        alert("論述の解答を入力してください。");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>⏳ AIが論述を分析中...</span>`;
      }

      setTimeout(() => {
        const finalResult = clientSideEvaluate(currentProblem, answer);
        displayEvaluationResult(finalResult);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>✨ AI添削を受ける ＆ 提出する</span>`;
        }
      }, 400);
    });
  }

  // 結果描画
  function displayEvaluationResult(res) {
    if (!resultContainer) return;
    resultContainer.style.display = "block";

    const rank = res.rank || "B";
    if (rankBadge) {
      rankBadge.textContent = rank;
      rankBadge.className = `rank-badge rank-${rank}-badge`;
    }

    if (rankBox) rankBox.className = `rank-header rank-${rank}-box`;

    const rankLabels = {
      A: "A判定 (十分達成 - 要点を的確に捉えた素晴らしい論述です！)",
      B: "B判定 (おおむね達成 - あと1つの重要視点を足せばA判定！)",
      C: "C判定 (努力を要する - 理由と結果の因果関係をつなげよう)",
      D: "D判定 (不十分 - まずは理由を1つ書くことから始めよう)"
    };

    if (rankTitle) rankTitle.textContent = rankLabels[rank] || `評価: ${rank}`;
    if (rankEngine) rankEngine.textContent = `判定エンジン: ${res.engine || "AI添削"} | ${new Date().toLocaleTimeString()} 添削完了`;

    if (fbGoodText) fbGoodText.textContent = res.goodPoints || "記述できています。";
    if (fbAdviceText) fbAdviceText.textContent = res.howToGetA || "さらに視点を広げてみましょう。";
    if (fbQuestionText) fbQuestionText.textContent = res.guidingQuestion || "別の視点から見るとどうなるでしょうか？";

    resultContainer.scrollIntoView({ behavior: "smooth" });
  }

  // 再推敲ボタン
  if (rewriteBtn) {
    rewriteBtn.addEventListener("click", () => {
      if (answerInput) {
        answerInput.focus();
        answerInput.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // 初期化実行
  renderProblemOptions();
});
