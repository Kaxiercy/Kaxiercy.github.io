/* Yong Cheng Homepage — Visitor Map */
(() => {
  "use strict";

  const API = "https://kaxiercy-visitor-api.chengyongyc.workers.dev";
  const WORLD_MAP_URL = "/assets/visitor/world-land.geojson";
  const MAP_NAME = "visitor-world-land";

  const $ = (id) => document.getElementById(id);

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function safeHostname(value) {
    if (!value) return "";
    try {
      return new URL(value).hostname.slice(0, 300);
    } catch {
      return "";
    }
  }

  function formatLocation(item) {
    return [item.city, item.region, item.country]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", ") || item.country_code || "Unknown location";
  }

  function precisionText(item) {
    if (item.geo_precision === "region") return "Approx. regional location";
    if (item.geo_precision === "country") return "Approx. country location";
    return "Approximate IP location";
  }

  function detectDarkMode() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  async function recordVisit() {
    try {
      const response = await fetch(`${API}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: window.location.pathname,
          referrer: safeHostname(document.referrer)
        }),
        credentials: "omit",
        keepalive: true
      });

      if (!response.ok) {
        throw new Error(`Visit API returned HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("Visitor visit logging failed:", error);
      return null;
    }
  }

  async function loadJSON(url) {
    const response = await fetch(url, {
      credentials: "omit",
      cache: "no-cache"
    });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    return response.json();
  }

  function updateMetrics(stats) {
    $("visitor-total").textContent = formatNumber(stats.total_visits);
    $("visitor-unique").textContent = formatNumber(stats.unique_visitors);
    $("visitor-countries").textContent = formatNumber(stats.countries);
    $("visitor-cities").textContent = formatNumber(stats.cities);
  }

  function buildPoints(locations) {
    return (locations || [])
      .filter((item) => {
        const lon = Number(item.longitude);
        const lat = Number(item.latitude);
        return Number.isFinite(lon) && Number.isFinite(lat);
      })
      .map((item) => ({
        name: formatLocation(item),
        visits: Number(item.visits || 0),
        precision: precisionText(item),
        value: [
          Number(item.longitude),
          Number(item.latitude),
          Number(item.visits || 0)
        ]
      }));
  }

  function renderMap(worldGeoJSON, stats) {
    if (!window.echarts) throw new Error("ECharts is not loaded.");

    window.echarts.registerMap(MAP_NAME, worldGeoJSON);

    const mapElement = $("visitor-map");
    const isDark = detectDarkMode();
    const chart = window.echarts.init(mapElement, null, { renderer: "canvas" });
    const points = buildPoints(stats.locations);

    const maxVisits = Math.max(1, ...points.map((p) => p.visits));

    chart.setOption({
      animation: true,
      animationDuration: 650,
      animationEasing: "cubicOut",

      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: isDark ? "rgba(15,23,42,0.96)" : "rgba(255,255,255,0.97)",
        borderColor: isDark ? "rgba(148,163,184,0.28)" : "rgba(13,73,148,0.18)",
        borderWidth: 1,
        padding: [9, 11],
        textStyle: {
          color: isDark ? "#e5e7eb" : "#1f2937",
          fontSize: 12,
          lineHeight: 18
        },
        extraCssText: "border-radius:8px;box-shadow:0 6px 22px rgba(17,24,39,.12);",
        formatter(params) {
          const data = params.data;
          if (!data || typeof data.visits === "undefined") return "";
          const count = Number(data.visits || 0);
          return [
            `<strong>${data.name}</strong>`,
            `${count.toLocaleString("en-US")} ${count === 1 ? "visit" : "visits"}`,
            `<span style=\"opacity:.64\">${data.precision}</span>`
          ].join("<br>");
        }
      },

      geo: {
        map: MAP_NAME,
        roam: false,
        silent: true,
        layoutCenter: ["50%", "50%"],
        layoutSize: "106%",
        itemStyle: {
          areaColor: isDark ? "#273244" : "#edf2f7",
          borderColor: isDark ? "#3b475a" : "#c5cfda",
          borderWidth: 0.65
        },
        emphasis: {
          disabled: true
        }
      },

      series: [
        {
          name: "Visitor locations",
          type: "scatter",
          coordinateSystem: "geo",
          data: points,
          zlevel: 2,
          symbol: "circle",
          symbolSize(value) {
            const visits = Math.max(1, Number(value[2] || 1));
            const normalized = Math.log1p(visits) / Math.log1p(maxVisits);
            return 6 + normalized * 11;
          },
          itemStyle: {
            color: "#0d4994",
            opacity: 0.82,
            borderColor: "#ffffff",
            borderWidth: 1.2,
            shadowBlur: 8,
            shadowColor: "rgba(13,73,148,0.24)"
          },
          emphasis: {
            scale: 1.35,
            itemStyle: {
              opacity: 1,
              shadowBlur: 12,
              shadowColor: "rgba(13,73,148,0.34)"
            }
          }
        }
      ]
    });

    const resize = () => chart.resize();
    window.addEventListener("resize", resize, { passive: true });

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(resize);
      observer.observe(mapElement);
    }
  }

  async function init() {
    const wrapper = document.querySelector(".visitor-dashboard");
    if (!wrapper) return;

    const loading = $("visitor-map-loading");

    try {
      // Record first so the current page view is reflected in the counters.
      await recordVisit();

      const [stats, worldGeoJSON] = await Promise.all([
        loadJSON(`${API}/stats`),
        loadJSON(WORLD_MAP_URL)
      ]);

      updateMetrics(stats);
      renderMap(worldGeoJSON, stats);

      loading?.classList.add("is-hidden");
    } catch (error) {
      console.error("Visitor map failed:", error);
      if (loading) {
        loading.classList.remove("is-hidden");
        loading.innerHTML = '<div class="visitor-status-error">Visitor statistics are temporarily unavailable.</div>';
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
