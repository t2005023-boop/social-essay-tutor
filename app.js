document.addEventListener("DOMContentLoaded", () => {
  let currentLevel = "high_school"; // "junior_high" | "high_school" | "university"
  let currentField = "civics";      // デフォルトを中学3年向け公民に
  let currentCategory = "all";      // "all" または選択されたカテゴリ
  let currentProblem = null;

  // DOM要素
  const levelBtns = document.querySelectorAll(".level-tab-btn");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const categorySelect = document.getElementById("category-select");
  const problemSelect = document.getElementById("problem-select");
  const problemTags = document.getElementById("problem-tags");
  const problemQuestion = document.getElementById("problem-question");
  const problemHints = document.getElementById("problem-hints");
  const problemGuide = document.getElementById("problem-guide");
  const charGuide = document.getElementById("char-guide");
  const charCount = document.getElementById("char-count");
  const answerInput = document.getElementById("answer-input");
  const form = document.getElementById("essay-form");
  const submitBtn = document.getElementById("submit-btn");

  // 模範解答例トグルDOM
  const toggleSampleBtn = document.getElementById("toggle-sample-btn");
  const sampleAnswerBox = document.getElementById("sample-answer-box");
  const sampleAnswerText = document.getElementById("sample-answer-text");

  // 結果DOM
  const resultContainer = document.getElementById("result-container");
  const rankBox = document.getElementById("rank-box");
  const rankBadge = document.getElementById("rank-badge");
  const rankTitle = document.getElementById("rank-title");
  const rankEngine = document.getElementById("rank-engine");
  const fbGoodText = document.getElementById("fb-good-text");
  const fbAdviceText = document.getElementById("fb-advice-text");
  const fbQuestionText = document.getElementById("fb-question-text");
  const toggleResultSampleBtn = document.getElementById("toggle-result-sample-btn");
  const resultSampleAnswerBox = document.getElementById("result-sample-answer-box");
  const resultSampleAnswerText = document.getElementById("result-sample-answer-text");
  const rewriteBtn = document.getElementById("rewrite-btn");

  // 学習ログDOM
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const logTableBody = document.getElementById("log-table-body");
  const logCountBadge = document.getElementById("log-count-badge");
  const clearLogsBtn = document.getElementById("clear-logs-btn");

  // GAS Googleスプレッドシート連携DOM
  const openGasModalBtn = document.getElementById("open-gas-modal-btn");
  const closeGasModalBtn = document.getElementById("close-gas-modal-btn");
  const gasModal = document.getElementById("gas-modal");
  const gasWebhookUrlInput = document.getElementById("gas-webhook-url");
  const saveGasUrlBtn = document.getElementById("save-gas-url-btn");
  const testGasBtn = document.getElementById("test-gas-btn");
  const gasStatusText = document.getElementById("gas-status-text");
  const gasTestResult = document.getElementById("gas-test-result");

  // GAS URLのサニタイズ（/edit や /dev を /exec に自動修正）
  function sanitizeGasUrl(url) {
    if (!url) return "";
    let clean = url.trim();
    if (clean.includes("/edit")) {
      clean = clean.split("/edit")[0] + "/exec";
    }
    if (clean.endsWith("/dev")) {
      clean = clean.substring(0, clean.length - 4) + "/exec";
    }
    return clean;
  }

  // GAS設定の初期ロード
  let gasUrl = sanitizeGasUrl(localStorage.getItem("social_essay_gas_url") || "");
  function updateGasStatus() {
    if (gasUrl && gasUrl.startsWith("http")) {
      gasStatusText.textContent = "連携中（Googleスプレッドシートへ自動送信）";
      gasStatusText.style.color = "#059669";
      if (gasWebhookUrlInput) gasWebhookUrlInput.value = gasUrl;
    } else {
      gasStatusText.textContent = "未設定（端末内保存のみ）";
      gasStatusText.style.color = "#d97706";
      if (gasWebhookUrlInput) gasWebhookUrlInput.value = "";
    }
  }
  updateGasStatus();

  // モーダル開閉
  if (openGasModalBtn) {
    openGasModalBtn.addEventListener("click", () => {
      gasModal.style.display = "flex";
      if (gasTestResult) gasTestResult.style.display = "none";
    });
  }
  if (closeGasModalBtn) {
    closeGasModalBtn.addEventListener("click", () => {
      gasModal.style.display = "none";
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === gasModal) gasModal.style.display = "none";
  });

  // GAS URL保存
  if (saveGasUrlBtn) {
    saveGasUrlBtn.addEventListener("click", () => {
      const inputVal = sanitizeGasUrl(gasWebhookUrlInput.value.trim());
      if (inputVal && !inputVal.startsWith("http")) {
        alert("有効なURL（https://script.google.com/...）を入力してください。");
        return;
      }
      gasUrl = inputVal;
      localStorage.setItem("social_essay_gas_url", gasUrl);
      updateGasStatus();
      alert("✅ Googleスプレッドシート連携設定を保存しました！\n生徒が添削を受けると自動的にスプレッドシートに書き込まれます。");
      gasModal.style.display = "none";
    });
  }

  // Googleスプレッドシートへの超高信頼ハイブリッド送信エンジン（GET Beacon + POST）
  function sendToGoogleSpreadsheet(logData) {
    if (!gasUrl || !gasUrl.startsWith("http")) return;

    const targetUrl = sanitizeGasUrl(gasUrl);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(logData)) {
      params.append(k, (v || "").toString());
    }
    const getUrl = `${targetUrl}?${params.toString()}`;

    try {
      const img = new Image();
      img.src = getUrl;
    } catch (e) {}

    try {
      fetch(getUrl, { mode: "no-cors" });
    } catch (e) {}

    try {
      fetch(targetUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(logData)
      });
    } catch (e) {}

    console.log("📊 Googleスプレッドシートへ送信を発行しました:", logData);
  }

  // GASテスト送信
  if (testGasBtn) {
    testGasBtn.addEventListener("click", () => {
      const testUrl = sanitizeGasUrl(gasWebhookUrlInput.value.trim());
      if (!testUrl || !testUrl.startsWith("http")) {
        alert("有効なGASウェブアプリURLを入力してください。");
        return;
      }
      testGasBtn.disabled = true;
      testGasBtn.textContent = "⏳ テストデータ送信中...";

      const testData = {
        timestamp: new Date().toLocaleString("ja-JP"),
        className: "1組",
        number: "99",
        name: "【接続テスト生徒】",
        level: "高校入試",
        field: "公民",
        problemId: "test_check",
        problemTitle: "【接続テスト】スプレッドシート連携確認",
        charCount: 28,
        rank: "A",
        answer: "Googleスプレッドシートへの自動書き込みテスト成功です！"
      };

      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(testData)) {
        params.append(k, v.toString());
      }
      const fullGetUrl = `${testUrl}?${params.toString()}`;

      const img = new Image();
      img.src = fullGetUrl;

      fetch(fullGetUrl, { mode: "no-cors" }).catch(() => {});
      fetch(testUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(testData)
      }).catch(() => {});

      setTimeout(() => {
        if (gasTestResult) {
          gasTestResult.style.display = "block";
          gasTestResult.style.background = "#ecfdf5";
          gasTestResult.style.border = "1.5px solid #10b981";
          gasTestResult.style.color = "#065f46";
          gasTestResult.innerHTML = `
            <strong>🎉 スプレッドシートへ送信シグナルを発行しました！</strong><br>
            先生のGoogleスプレッドシートを開いて、新しい行に「【接続テスト生徒】」が追加されたかご確認ください。
          `;
        }
        testGasBtn.disabled = false;
        testGasBtn.textContent = "🧪 スプレッドシートへテスト送信";
      }, 800);
    });
  }

  // 難易度レベル切り替え
  levelBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      levelBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentLevel = btn.dataset.level;
      currentCategory = "all";
      renderCategories();
    });
  });

  // 分野切り替え
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentField = btn.dataset.field;
      currentCategory = "all";
      renderCategories();
    });
  });

  // 単元・小分野（カテゴリ・時代）の選択肢生成
  function renderCategories() {
    const levelData = PROBLEM_DATA[currentLevel] || {};
    const problems = levelData[currentField] || [];
    categorySelect.innerHTML = "";

    const catSet = new Set();
    problems.forEach(p => {
      if (p.category) catSet.add(p.category);
    });

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = `🌟 【すべての単元・時代を表示】 (${problems.length}問)`;
    categorySelect.appendChild(allOption);

    catSet.forEach(catName => {
      const opt = document.createElement("option");
      opt.value = catName;
      const count = problems.filter(p => p.category === catName).length;
      opt.textContent = `📂 ${catName} (${count}問)`;
      categorySelect.appendChild(opt);
    });

    categorySelect.value = currentCategory;
    renderProblemOptions();
  }

  categorySelect.addEventListener("change", (e) => {
    currentCategory = e.target.value;
    renderProblemOptions();
  });

  // 模範解答トグルイベント（問題カード内）
  toggleSampleBtn.addEventListener("click", () => {
    if (sampleAnswerBox.style.display === "none" || !sampleAnswerBox.style.display) {
      sampleAnswerBox.style.display = "block";
      toggleSampleBtn.innerHTML = `<span>🙈 模範解答例を隠す（クリックで閉じる）</span>`;
    } else {
      sampleAnswerBox.style.display = "none";
      toggleSampleBtn.innerHTML = `<span>💡 模範解答例を見る（クリックで開く）</span>`;
    }
  });

  // 模範解答トグルイベント（添削結果内）
  if (toggleResultSampleBtn) {
    toggleResultSampleBtn.addEventListener("click", () => {
      if (resultSampleAnswerBox.style.display === "none" || !resultSampleAnswerBox.style.display) {
        resultSampleAnswerBox.style.display = "block";
        toggleResultSampleBtn.innerHTML = `<span>🙈 模範解答例を閉じる</span>`;
      } else {
        resultSampleAnswerBox.style.display = "none";
        toggleResultSampleBtn.innerHTML = `<span>💡 模範解答例と見比べる（クリックで表示）</span>`;
      }
    });
  }

  // 問題ドロップダウンの更新（単元フィルタ連動）
  function renderProblemOptions() {
    const levelData = PROBLEM_DATA[currentLevel] || {};
    let problems = levelData[currentField] || [];

    // 単元フィルタリング
    if (currentCategory && currentCategory !== "all") {
      problems = problems.filter(p => p.category === currentCategory);
    }

    problemSelect.innerHTML = "";

    const categories = {};
    problems.forEach(p => {
      const cat = p.category || "基本問題";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(p);
    });

    for (const [catName, probList] of Object.entries(categories)) {
      const group = document.createElement("optgroup");
      group.label = `【${catName}】`;
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
      problemTags.innerHTML = "";
      problemQuestion.textContent = "該当する単元の問題がありません";
      problemHints.style.display = "none";
      problemGuide.style.display = "none";
    }
  }

  // 問題選択時の詳細表示
  function selectProblem(problemId) {
    const levelData = PROBLEM_DATA[currentLevel] || {};
    const problems = levelData[currentField] || [];
    currentProblem = problems.find(p => p.id === problemId) || problems[0];

    if (!currentProblem) return;

    sampleAnswerBox.style.display = "none";
    toggleSampleBtn.innerHTML = `<span>💡 模範解答例を見る（クリックで開く）</span>`;
    sampleAnswerText.textContent = currentProblem.sampleAnswer || "模範解答準備中";

    if (resultSampleAnswerBox) {
      resultSampleAnswerBox.style.display = "none";
      resultSampleAnswerText.textContent = currentProblem.sampleAnswer || "模範解答準備中";
      toggleResultSampleBtn.innerHTML = `<span>💡 模範解答例と見比べる（クリックで表示）</span>`;
    }

    const levelLabels = {
      junior_high: "🎒 中学入試レベル",
      high_school: "🏫 高校入試・中3レベル",
      university: "🎓 大学入試レベル"
    };

    const tagsHtml = [
      `<span class="tag" style="background:#1e3a8a; color:#fff;">${levelLabels[currentLevel]}</span>`,
      `<span class="tag" style="background:#0284c7; color:#fff;">📂 ${currentProblem.category || '単元'}</span>`,
      ...(currentProblem.tags || []).map(tag => `<span class="tag"># ${tag}</span>`)
    ].join("");

    problemTags.innerHTML = tagsHtml;
    problemQuestion.textContent = currentProblem.question;

    if (currentProblem.keywords && currentProblem.keywords.length > 0) {
      problemHints.innerHTML = `<strong>💡 着眼点キーワードの例:</strong> ${currentProblem.keywords.join("、")}`;
      problemHints.style.display = "block";
    } else {
      problemHints.style.display = "none";
    }

    if (currentProblem.writingTemplate) {
      problemGuide.innerHTML = `<strong>📝 書き方に迷ったときのステップ:</strong>\n${currentProblem.writingTemplate}`;
      problemGuide.style.display = "block";
    } else {
      problemGuide.style.display = "none";
    }

    charGuide.textContent = `目安: ${currentProblem.minChars}〜${currentProblem.maxChars}文字`;
  }

  problemSelect.addEventListener("change", (e) => {
    selectProblem(e.target.value);
  });

  // 文字数カウント
  answerInput.addEventListener("input", () => {
    const len = answerInput.value.length;
    charCount.textContent = len;
  });

  // クライアント側ローカル評価エンジン（模範解答照合・100% A判定保証）
  function clientSideEvaluate(level, field, problem, answerText) {
    const rawAnswer = (answerText || '').trim();
    const cleanAnswer = rawAnswer.replace(/[\s\r\n\t、。・「」『』（）()!！?？,.]/g, '');
    const length = rawAnswer.length;

    const rawSample = problem && problem.sampleAnswer ? problem.sampleAnswer : '';
    const cleanSample = rawSample.replace(/[\s\r\n\t、。・「」『』（）()!！?？,.]/g, '');

    // 1. 模範解答との直接照合
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

    // 2. キーワード検出（単語レベル）
    const keywords = problem ? problem.keywords : [];
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

    const minTarget = level === 'junior_high' ? 30 : level === 'university' ? 80 : 45;

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
                         (hitKeywords.length >= 1 && hasConnective && length >= minTarget) ||
                         (level === 'junior_high' && (hitKeywords.length >= 1 || isSampleAnswerMatch));

    let rank = 'C';
    let howToGetA = '';
    let guidingQuestion = '';

    if (isAQualified) {
      rank = 'A';
      howToGetA = `【🎉 A判定達成！要点を的確に捉えた素晴らしい論述です】\n・出題意図に対する必要な要素・因果関係・重要用語がすべて的確に盛り込まれています！\n・定期試験・入試本番でも満点（最高評価）を獲得できる優れた記述力です。この調子で他の単元の問題にも挑戦してみましょう！`;
      guidingQuestion = 'この素晴らしい論述の型（理由→展開→結論）を、他のテーマでも再現できるように練習してみましょう！';
    } else if (length < 20) {
      rank = 'D';
      const sampleKw = missingKeywords.slice(0, 2).join('」や「');
      howToGetA = `【A判定にするための最短ナビ】\n① 【入れるキーワード】: 「${sampleKw || '理由'}」という言葉を使います。\n② 【文の組み立て】: 「〇〇によって、△△となるため。」と因果関係を作ります。\n③ 【完成目標】: 目安として${minTarget}文字以上のまとまった文章に仕上げましょう。`;
      guidingQuestion = 'まずは箇条書きメモを使って、思いつく理由を2つ書き出してみませんか？';
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

  // 学習ログの保存（localStorage）
  function saveLearningLog(record) {
    let logs = [];
    try {
      const stored = localStorage.getItem("social_essay_learning_logs");
      if (stored) logs = JSON.parse(stored);
    } catch (e) {
      logs = [];
    }

    logs.unshift(record);
    localStorage.setItem("social_essay_learning_logs", JSON.stringify(logs));
    renderLogs();
  }

  // 学習ログの描画
  function renderLogs() {
    let logs = [];
    try {
      const stored = localStorage.getItem("social_essay_learning_logs");
      if (stored) logs = JSON.parse(stored);
    } catch (e) {
      logs = [];
    }

    if (logCountBadge) logCountBadge.textContent = `${logs.length}件`;
    if (!logTableBody) return;

    logTableBody.innerHTML = "";
    if (logs.length === 0) {
      logTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:16px;">まだ学習履歴はありません。問題に挑戦して添削を受けてみましょう！</td></tr>`;
      return;
    }

    logs.slice(0, 50).forEach((item) => {
      const tr = document.createElement("tr");
      const rankClass = `badge-rank-${item.rank || 'B'}`;
      tr.innerHTML = `
        <td style="font-size:0.8rem; color:#64748b;">${item.timestamp || ''}</td>
        <td><strong>${item.className}</strong></td>
        <td>${item.number ? item.number + '番' : '-'}</td>
        <td>${item.name || '-'}</td>
        <td style="font-size:0.85rem;">${item.fieldLabel || item.field} - ${item.problemTitle || item.problemId}</td>
        <td>${item.charCount || item.answer.length}字</td>
        <td><span class="rank-mini-badge ${rankClass}">${item.rank}</span></td>
        <td class="log-answer-cell" title="${item.answer.replace(/"/g, '&quot;')}">${item.answer}</td>
      `;
      logTableBody.appendChild(tr);
    });
  }

  // CSVエクスポート機能（スプレッドシート・Excel対応 BOM付きUTF-8）
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      let logs = [];
      try {
        const stored = localStorage.getItem("social_essay_learning_logs");
        if (stored) logs = JSON.parse(stored);
      } catch (e) {
        logs = [];
      }

      if (logs.length === 0) {
        alert("エクスポートする学習履歴がまだありません。");
        return;
      }

      const headers = ["日時", "クラス", "出席番号", "氏名", "挑戦レベル", "分野", "問題ID", "問題タイトル", "文字数", "評価ランク", "生徒の論述解答"];
      const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

      let csvContent = "\uFEFF" + headers.join(",") + "\n";
      logs.forEach(log => {
        const row = [
          escapeCsv(log.timestamp),
          escapeCsv(log.className),
          escapeCsv(log.number),
          escapeCsv(log.name),
          escapeCsv(log.level),
          escapeCsv(log.field),
          escapeCsv(log.problemId),
          escapeCsv(log.problemTitle),
          escapeCsv(log.charCount || log.answer.length),
          escapeCsv(log.rank),
          escapeCsv(log.answer)
        ];
        csvContent += row.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      link.setAttribute("href", url);
      link.setAttribute("download", `社会科論述_学習履歴_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  // 履歴クリア機能
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener("click", () => {
      if (confirm("学習履歴をすべて消去しますか？")) {
        localStorage.removeItem("social_essay_learning_logs");
        renderLogs();
      }
    });
  }

  // フォーム送信
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const studentClass = document.getElementById("student-class").value;
    const studentNum = document.getElementById("student-num").value;
    const studentName = document.getElementById("student-name").value;
    const answer = answerInput.value.trim();

    if (!studentClass) {
      alert("クラスを選択してください。");
      return;
    }
    if (!answer) {
      alert("論述の解答を入力してください。");
      return;
    }

    const selectedProblemId = problemSelect.value;
    const levelData = PROBLEM_DATA[currentLevel] || {};
    const problems = levelData[currentField] || [];
    currentProblem = problems.find(p => p.id === selectedProblemId) || currentProblem;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳ AIが論述を分析中 ＆ スプレッドシート送信中...</span>`;

    const payload = {
      student: {
        className: studentClass,
        number: studentNum,
        name: studentName
      },
      level: currentLevel,
      field: currentField,
      problemId: currentProblem.id,
      questionText: currentProblem.question,
      answerText: answer
    };

    let finalResult = null;

    try {
      if (window.location.protocol.startsWith("http")) {
        const response = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          finalResult = await response.json();
        }
      }
    } catch (err) {
      console.log("ローカルエンジンで即時評価します:", err);
    }

    if (!finalResult) {
      finalResult = clientSideEvaluate(currentLevel, currentField, currentProblem, answer);
    }

    displayEvaluationResult(finalResult);

    // ログデータオブジェクトの構築
    const fieldNames = { geography: "地理", history: "歴史", civics: "公民" };
    const levelNames = { junior_high: "中学入試", high_school: "高校入試", university: "大学入試" };
    const logData = {
      timestamp: new Date().toLocaleString("ja-JP"),
      className: studentClass,
      number: studentNum,
      name: studentName,
      level: levelNames[currentLevel] || currentLevel,
      field: fieldNames[currentField] || currentField,
      problemId: currentProblem.id,
      problemTitle: currentProblem.title,
      charCount: answer.length,
      rank: finalResult.rank,
      answer: answer
    };

    saveLearningLog(logData);
    sendToGoogleSpreadsheet(logData);

    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>✨ AI添削を受ける ＆ 提出する</span>`;
  });

  // 結果描画
  function displayEvaluationResult(res) {
    resultContainer.style.display = "block";

    const rank = res.rank || "B";
    rankBadge.textContent = rank;

    rankBox.className = `rank-header rank-${rank}-box`;
    rankBadge.className = `rank-badge rank-${rank}-badge`;

    const rankLabels = {
      A: "A判定 (十分達成 - 要点を的確に捉えた素晴らしい論述です！)",
      B: "B判定 (おおむね達成 - あと1つの重要視点を足せばA判定！)",
      C: "C判定 (努力を要する - 理由と結果の因果関係をつなげよう)",
      D: "D判定 (不十分 - まずは箇条書きメモから始めよう)"
    };

    rankTitle.textContent = rankLabels[rank] || `評価: ${rank}`;
    rankEngine.textContent = `判定エンジン: ${res.engine || "AI添削"} | ${new Date().toLocaleTimeString()} 添削完了`;

    fbGoodText.textContent = res.goodPoints || "記述できています。";
    fbAdviceText.textContent = res.howToGetA || res.concreteAdvice || res.improvementAdvice || "さらに視点を広げてみましょう。";
    fbQuestionText.textContent = res.guidingQuestion || "別の視点から見るとどうなるでしょうか？";

    if (resultSampleAnswerText) {
      resultSampleAnswerText.textContent = res.sampleAnswer || (currentProblem ? currentProblem.sampleAnswer : "模範解答準備中");
    }

    resultContainer.scrollIntoView({ behavior: "smooth" });
  }

  // 再推敲（リライト）ボタン
  rewriteBtn.addEventListener("click", () => {
    answerInput.focus();
    answerInput.scrollIntoView({ behavior: "smooth" });
  });

  // 初期化実行
  renderCategories();
  renderLogs();
});
