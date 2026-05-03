// js/pages/sell.js
window.DKYSell = (function() {
  let spotUnsub = null;
  let chartUnsub = null;
  let karat = 18, weight = 10, form = "solid", condition = "new";
  const PURITY = { 10: 0.4167, 14: 0.5833, 18: 0.75, 22: 0.9167, 24: 1 };
  const KARATS = [10, 14, 18, 22, 24];
  
  // Helper functions
  const $ = (sel, root) => (root || document).querySelector(sel);
  const fmtMoney = (n) => "$" + Math.round(n).toLocaleString();
  const fmtMoney2 = (n) => "$" + n.toFixed(2);
  
  function setupChart() {
    const STORAGE = "dky-chart-history-v1";
    const MAX = 500;
    let history = [];
    try { history = JSON.parse(localStorage.getItem(STORAGE) || "[]"); } catch (e) { history = []; }
    let hover = null;

    const RANGE_MS = 60 * 60 * 1000;
    const W = 720, H = 240, PAD_X = 12, PAD_Y = 28;

    const spot = window.DKYSpot;
    if (!spot) return () => {};

    const off = spot.onSpot((s) => {
      if (s.perGram == null || !s.updatedAt) return;
      if (history.length === 0) {
        const now = Date.now(); let v = s.perGram * (1 - 0.018);
        for (let i = 144; i > 0; i--) {
          v += (Math.random() - 0.48) * (s.perGram * 0.0018);
          history.push({ t: now - i * 10 * 60000, v });
        }
        history.push({ t: now, v: s.perGram });
      } else {
        const last = history[history.length - 1];
        if (!last || Math.abs(last.v - s.perGram) >= 0.0001 || s.updatedAt.getTime() - last.t >= 30000) {
          history.push({ t: s.updatedAt.getTime(), v: s.perGram });
          if (history.length > MAX) history = history.slice(-MAX);
        }
      }
      try { localStorage.setItem(STORAGE, JSON.stringify(history)); } catch (e) {}
      paint();
    });

    function filtered() {
      const now = Date.now();
      return history.filter((p) => now - p.t <= RANGE_MS);
    }

    function fmtTime(t) {
      const d = new Date(t);
      const sameDay = new Date().toDateString() === d.toDateString();
      return sameDay
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function paint() {
      const data = filtered();
      const content = $("#chart-content");
      const stats = $("#chart-stats");
      if (!content) return;
      if (data.length < 2) {
        content.innerHTML = '<text x="360" y="120" text-anchor="middle" fill="currentColor" opacity="0.5" font-size="12">Loading live chart…</text>';
        return;
      }
      const values = data.map((p) => p.v);
      const min = Math.min(...values), max = Math.max(...values);
      const range01 = Math.max(max - min, 0.0001);
      const padded = range01 * 0.18;
      const yMin = min - padded, yMax = max + padded, yRange = yMax - yMin;
      const xStep = (W - PAD_X * 2) / Math.max(data.length - 1, 1);
      const points = data.map((p, i) => ({
        x: PAD_X + i * xStep,
        y: PAD_Y + (1 - (p.v - yMin) / yRange) * (H - PAD_Y * 2),
        v: p.v, t: p.t,
      }));
      const path = points.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
      const last = points[points.length - 1];
      const area = path + " L" + last.x.toFixed(2) + "," + (H - PAD_Y) + " L" + points[0].x.toFixed(2) + "," + (H - PAD_Y) + " Z";
      const minIdx = values.indexOf(min), maxIdx = values.indexOf(max);

      const first = data[0].v, lastV = data[data.length - 1].v;
      const change = lastV - first;
      const changePct = (change / first) * 100;
      const up = change >= 0;

      const displayV = hover ? hover.v : lastV;
      const dChange = displayV - first;
      const dPct = (dChange / first) * 100;
      const dUp = dChange >= 0;

      $("#chart-price").textContent = fmtMoney2(displayV);
      const changeEl = $("#chart-change");
      if (changeEl) {
        changeEl.className = "chart-change " + (dUp ? "up" : "down");
        changeEl.textContent = (dUp ? "▲ " : "▼ ") + Math.abs(dChange).toFixed(2) + " (" + dPct.toFixed(2) + "%)";
      }
      $("#chart-time").textContent = hover ? fmtTime(hover.t) : "";

      let svg = "";
      [0.2, 0.4, 0.6, 0.8].forEach((r) => {
        const y = PAD_Y + r * (H - PAD_Y * 2);
        svg += `<line x1="${PAD_X}" x2="${W - PAD_X}" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity="0.07" stroke-dasharray="3 5" />`;
      });
      svg += `<path d="${area}" fill="url(#goldFill)" />`;
      svg += `<path d="${path}" fill="none" stroke="url(#goldStroke)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />`;
      svg += `<line x1="${points[maxIdx].x}" x2="${points[maxIdx].x}" y1="${points[maxIdx].y - 4}" y2="${points[maxIdx].y - 16}" stroke="var(--gold-bright)" stroke-opacity="0.5" stroke-dasharray="2 2" />`;
      svg += `<text x="${points[maxIdx].x}" y="${points[maxIdx].y - 20}" text-anchor="middle" fill="var(--emerald)" font-family="ui-monospace,SFMono-Regular,monospace" font-size="10" font-weight="700">▲ ${fmtMoney2(max)}</text>`;
      svg += `<line x1="${points[minIdx].x}" x2="${points[minIdx].x}" y1="${points[minIdx].y + 4}" y2="${points[minIdx].y + 16}" stroke="var(--gold-deep)" stroke-opacity="0.5" stroke-dasharray="2 2" />`;
      svg += `<text x="${points[minIdx].x}" y="${points[minIdx].y + 26}" text-anchor="middle" fill="var(--rose)" font-family="ui-monospace,SFMono-Regular,monospace" font-size="10" font-weight="700">▼ ${fmtMoney2(min)}</text>`;
      svg += `<circle cx="${last.x}" cy="${last.y}" r="4" fill="var(--gold-bright)" />`;
      svg += `<circle cx="${last.x}" cy="${last.y}" r="8" fill="var(--gold-bright)" opacity="0.3"><animate attributeName="r" values="6;14;6" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="2.2s" repeatCount="indefinite"/></circle>`;
      if (hover) {
        svg += `<line x1="${hover.x}" x2="${hover.x}" y1="${PAD_Y}" y2="${H - PAD_Y}" stroke="var(--gold-bright)" stroke-opacity="0.5" stroke-dasharray="3 3"/>`;
        svg += `<line x1="${PAD_X}" x2="${W - PAD_X}" y1="${hover.y}" y2="${hover.y}" stroke="var(--gold-bright)" stroke-opacity="0.3" stroke-dasharray="3 3"/>`;
        svg += `<circle cx="${hover.x}" cy="${hover.y}" r="5" fill="var(--gold-bright)" stroke="var(--background)" stroke-width="2"/>`;
      }
      content.innerHTML = svg;

      const svgEl = $("#chart-svg");
      if (svgEl) {
        svgEl.onmousemove = (e) => {
          const rect = svgEl.getBoundingClientRect();
          const xPx = ((e.clientX - rect.left) / rect.width) * W;
          let nearest = points[0], best = Math.abs(points[0].x - xPx);
          for (const p of points) { const d = Math.abs(p.x - xPx); if (d < best) { best = d; nearest = p; } }
          hover = nearest; paint();
        };
        svgEl.onmouseleave = () => { hover = null; paint(); };
      }

      const i18n = window.DKYI18n;
      stats.innerHTML = [
        { l: i18n ? i18n.t("open") : "Open", v: fmtMoney2(first) },
        { l: i18n ? i18n.t("high") : "High", v: fmtMoney2(max), c: "var(--emerald)" },
        { l: i18n ? i18n.t("low") : "Low", v: fmtMoney2(min), c: "var(--rose)" },
        { l: i18n ? i18n.t("change") : "Change", v: (up ? "+" : "") + changePct.toFixed(2) + "%", c: up ? "var(--emerald)" : "var(--rose)" },
      ].map((s) => `
        <div class="chart-stat">
          <div class="l">${s.l}</div>
          <div class="v" style="${s.c ? "color:" + s.c : ""}">${s.v}</div>
        </div>
      `).join("");

      const upd = spot.spotState?.updatedAt ? spot.spotState.updatedAt.toLocaleTimeString() : "—";
      const sourceText = i18n ? i18n.t("source") : "Source";
      const updatedText = i18n ? i18n.t("updated") : "Updated";
      const lastHourText = i18n ? i18n.t("last_hour") : "Last hour · Hover for details";
      $("#chart-foot").innerHTML = `${sourceText}: ${spot.spotState?.source || "fallback"} · ${updatedText} ${upd} · ${lastHourText}`;
    }

    paint();
    return () => { off(); };
  }

  function recalc() {
    const spot = window.DKYSpot;
    const spotPrice = spot?.getSpotPrice() || 0;
    const pureGrams = weight * PURITY[karat];
    const goldValue = pureGrams * spotPrice;
    let minPct = 0.90, maxPct = 0.92;
    maxPct -= (condition === "old" ? 0.01 : 0) + (form === "semi-solid" ? 0.01 : 0);
    const minPay = goldValue * minPct, maxPay = goldValue * maxPct;
    
    const payoutMin = document.getElementById("payout-min");
    const payoutMax = document.getElementById("payout-max");
    const pureGramsEl = document.getElementById("pure-grams");
    const spotValueEl = document.getElementById("spot-value");
    const rateEl = document.getElementById("rate");
    
    if (payoutMin) payoutMin.textContent = fmtMoney(minPay);
    if (payoutMax) payoutMax.textContent = fmtMoney(maxPay);
    if (pureGramsEl) pureGramsEl.textContent = pureGrams.toFixed(2) + " g";
    if (spotValueEl) spotValueEl.textContent = fmtMoney2(goldValue);
    if (rateEl) rateEl.textContent = (minPct * 100).toFixed(0) + "–" + (maxPct * 100).toFixed(0) + "%";
    
    const i18n = window.DKYI18n;
    const lang = i18n?.getLang() || "es";
    const cfg = window.DKY_CONFIG;
    const whatsappNumber = cfg ? cfg.WHATSAPP_NUMBER : "";
    
    let msg = "";
    if (lang === "es") {
      msg = "Hola " + cfg.BUSINESS_NAME + "! Me gustaría una cotización para vender:\n\n" +
        "• Quilate: " + karat + "k\n" +
        "• Peso: " + weight + "g\n" +
        "• Forma: " + (form === "solid" ? "sólido" : "semi-sólido") + "\n" +
        "• Estado: " + (condition === "new" ? "nuevo" : "usado") + "\n\n" +
        "Pago estimado: " + fmtMoney(minPay) + " – " + fmtMoney(maxPay) + " USD\n\n" +
        "¿Cuándo puedo llevar el oro para evaluación?";
    } else {
      msg = "Hi " + cfg.BUSINESS_NAME + "! I'd like a quote to sell:\n\n" +
        "• Karat: " + karat + "k\n" +
        "• Weight: " + weight + "g\n" +
        "• Form: " + form + "\n" +
        "• Condition: " + condition + "\n\n" +
        "Estimated payout: " + fmtMoney(minPay) + " – " + fmtMoney(maxPay) + " USD\n\n" +
        "When can I bring the gold for evaluation?";
    }
    
    const quoteCta = document.getElementById("quote-cta");
    if (quoteCta) {
      quoteCta.href = "https://wa.me/" + encodeURIComponent(whatsappNumber) + "?text=" + encodeURIComponent(msg);
    }
  }

  function render() {
    const i18n = window.DKYI18n;
    const spot = window.DKYSpot;
    const t = (key) => i18n ? i18n.t(key) : key;
    const app = document.getElementById("app");
    
    app.innerHTML = `
      <section class="sell">
        <div class="container">
          <header class="sell-head">
            <span class="pill">⚖ ${t("sell_your_gold_showcase")}</span>
            <h1>${t("sell_title")}</h1>
            <p>${t("sell_desc")}</p>
          </header>

          <div class="chart" id="chart-root">
            <div class="chart-head">
              <div>
                <p class="meta"><span class="dot"></span> ${t("live_spot")} · USD / gram · LIVE</p>
                <div class="chart-price-row">
                  <span class="chart-price gold-text" id="chart-price">$—</span>
                  <span class="chart-change up" id="chart-change">+0.00 (0.00%)</span>
                </div>
                <p class="chart-time" id="chart-time"></p>
              </div>
            </div>
            <svg id="chart-svg" viewBox="0 0 720 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="goldFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="var(--gold-bright)" stop-opacity="0.55" />
                  <stop offset="60%" stop-color="var(--gold-bright)" stop-opacity="0.15" />
                  <stop offset="100%" stop-color="var(--gold-bright)" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="goldStroke" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stop-color="var(--gold-deep)" />
                  <stop offset="100%" stop-color="var(--gold-bright)" />
                </linearGradient>
              </defs>
              <g id="chart-content"></g>
            </svg>
            <div class="chart-stats" id="chart-stats"></div>
            <p class="chart-foot" id="chart-foot"></p>
          </div>

          <div class="calc-grid">
            <div class="calc-panel">
              <div>
                <label class="field-label">${t("karat")}</label>
                <div class="karat-row" id="karat-row">
                  ${KARATS.map(k => `<button type="button" class="karat-btn ${k === karat ? "active" : ""}" data-k="${k}">${k}k</button>`).join("")}
                </div>
                <p class="purity-note" id="purity-note">${t("reference_rate_note")} ${(PURITY[karat] * 100).toFixed(1)}%</p>
              </div>

              <div>
                <label class="field-label" for="weight">${t("weight_grams")}</label>
                <div class="weight-row">
                  <input id="weight" class="weight-input" type="number" inputmode="decimal" min="0" step="0.1" value="${weight}" placeholder="0.0" />
                  <span class="unit">${t("grams_unit")}</span>
                </div>
              </div>

              <div>
                <label class="field-label">${t("form")}</label>
                <div class="toggle-pill" id="form-row">
                  <button type="button" class="${form === "solid" ? "active" : ""}" data-f="solid">${t("solid")}</button>
                  <button type="button" class="${form === "semi-solid" ? "active" : ""}" data-f="semi-solid">${t("semi_solid")}</button>
                </div>
              </div>

              <div>
                <label class="field-label">${t("condition")}</label>
                <div class="toggle-pill" id="cond-row">
                  <button type="button" class="${condition === "new" ? "active" : ""}" data-c="new">${t("new_cond")}</button>
                  <button type="button" class="${condition === "old" ? "active" : ""}" data-c="old">${t("old_cond")}</button>
                </div>
              </div>

              <div class="info-callout">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>${t("info_callout")}</span>
              </div>
            </div>

            <aside class="quote-panel">
              <p class="quote-label">${t("estimated_payout")}</p>
              <div class="quote-amount">
                <span class="v gold-text" id="payout-min">$—</span>
                <span class="sep">–</span>
                <span class="v gold-text" id="payout-max">$—</span>
                <span class="ccy">USD</span>
              </div>
              <ul class="quote-list">
                <li><span>${t("pure_gold_content")}</span><span id="pure-grams">— g</span></li>
                <li><span>${t("spot_value")}</span><span id="spot-value">$—</span></li>
              </ul>
              <a class="btn-primary quote-cta" id="quote-cta" href="#" target="_blank">${t("get_quote_whatsapp")}</a>
              <p class="quote-foot">${t("final_offer_note")}</p>
            </aside>
          </div>
        </div>
      </section>
    `;

    // Bind events
    document.querySelectorAll("#karat-row .karat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        karat = parseInt(btn.dataset.k);
        document.querySelectorAll("#karat-row .karat-btn").forEach(b => {
          b.classList.toggle("active", parseInt(b.dataset.k) === karat);
        });
        const purityNote = document.getElementById("purity-note");
        if (purityNote) {
          purityNote.textContent = `${t("reference_rate_note")} ${(PURITY[karat] * 100).toFixed(1)}%`;
        }
        recalc();
      });
    });
    
    const weightInput = document.getElementById("weight");
    if (weightInput) {
      weightInput.addEventListener("input", (e) => {
        weight = Math.max(0, parseFloat(e.target.value) || 0);
        recalc();
      });
    }
    
    document.querySelectorAll("#form-row button").forEach(btn => {
      btn.addEventListener("click", () => {
        form = btn.dataset.f;
        document.querySelectorAll("#form-row button").forEach(b => {
          b.classList.toggle("active", b.dataset.f === form);
        });
        recalc();
      });
    });
    
    document.querySelectorAll("#cond-row button").forEach(btn => {
      btn.addEventListener("click", () => {
        condition = btn.dataset.c;
        document.querySelectorAll("#cond-row button").forEach(b => {
          b.classList.toggle("active", b.dataset.c === condition);
        });
        recalc();
      });
    });

    // Initialize chart and spot
    if (spot) {
      chartUnsub = setupChart();
      spotUnsub = spot.onSpot(() => recalc());
    }
    recalc();
    
    return () => {
      if (spotUnsub) spotUnsub();
      if (chartUnsub) chartUnsub();
    };
  }
  
  return { render };
})();