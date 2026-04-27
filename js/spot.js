window.DKYSpot = (function() {
  "use strict";
  
  const GRAMS_PER_OZ = 31.1035;
  const spotState = { perOz: null, perGram: null, source: "loading", updatedAt: null };
  const listeners = new Set();
  
  function onSpot(fn) { 
    listeners.add(fn); 
    fn(spotState); 
    return () => listeners.delete(fn); 
  }
  
  function emitSpot() { 
    listeners.forEach(fn => fn(spotState)); 
  }
  
  function fmtMoney2(n) {
    return "$" + n.toFixed(2);
  }
  
  const apiSources = [
    {
      name: "gold-api.com",
      url: "https://api.gold-api.com/price/XAU/USD",
      headers: {},
      parse: (data) => (data && typeof data.price === "number" && data.price > 0 ? data.price : null)
    },
    {
      name: "goldapi.io",
      url: "https://www.goldapi.io/api/XAU/USD",
      headers: { "x-access-token": "goldapi-9bf9dcfd2c5429df67786cf24e672b4b-io" },
      parse: (data) => data.price_gram_24k ? data.price_gram_24k * GRAMS_PER_OZ : null
    },
    {
      name: "goldprice.org",
      url: "https://data-asg.goldprice.org/dbXRates/USD",
      headers: { Accept: "application/json" },
      parse: (data) => {
        const oz = data?.items?.[0]?.xauPrice;
        return typeof oz === "number" && oz > 0 ? oz : null;
      }
    }
  ];
  
  async function fetchSpot() {
    for (const source of apiSources) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const response = await fetch(source.url, {
          headers: source.headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const ozPrice = source.parse(data);
        
        if (ozPrice && ozPrice > 0) {
          spotState.perOz = ozPrice;
          spotState.perGram = ozPrice / GRAMS_PER_OZ;
          spotState.source = source.name;
          spotState.updatedAt = new Date();
          emitSpot();
          return;
        }
      } catch (e) {
        clearTimeout(timeoutId);
        continue;
      }
    }
    
    if (!spotState.perOz && window.DKY_CONFIG) {
      spotState.perOz = window.DKY_CONFIG.FALLBACK_USD_PER_OZ;
      spotState.perGram = spotState.perOz / GRAMS_PER_OZ;
      spotState.source = "fallback";
      spotState.updatedAt = new Date();
      emitSpot();
    }
  }
  
  function getSpotPrice() {
    return spotState.perGram;
  }
  
  function init() {
    fetchSpot();
    setInterval(fetchSpot, 6 * 60 * 1000);
  }
  
  function bindTicker() {
    return onSpot((s) => {
      const tickerEl = document.getElementById("ticker-price");
      if (tickerEl && s.perGram != null) {
        tickerEl.textContent = fmtMoney2(s.perGram) + "/g";
      }
    });
  }
  
  function tickerHTML() {
    const i18n = window.DKYI18n;
    const label = i18n ? i18n.t("live_spot") : "Live spot";
    return `
      <span class="dot"></span>
      <span class="label">${label}</span>
      <span class="price" id="ticker-price">…</span>
    `;
  }
  
  return { init, onSpot, getSpotPrice, bindTicker, tickerHTML, fmtMoney2 };
})();