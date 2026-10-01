import React, { useEffect, useRef } from 'react';
import { BinaryContract, Ticker } from '../types';
import { binanceFeed } from '../services/binanceFeed';
import { wsClient } from '../services/websocket';

interface BinaryLiveCanvasProps {
  symbol?: string;
  basePrice: number;
  isDark?: boolean;
  isDashboard?: boolean;
  durationSeconds?: number;
  viewExpirySeconds?: number;
  betExpirySeconds?: number;
  activeContracts: BinaryContract[];
  onPriceUpdate?: (price: number) => void;
}

export const BinaryLiveCanvas: React.FC<BinaryLiveCanvasProps> = ({
  symbol = 'BTC/USDT',
  basePrice,
  isDark = false,
  isDashboard = false,
  durationSeconds = 60,
  viewExpirySeconds,
  betExpirySeconds,
  activeContracts,
  onPriceUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1-Second Real Market Price Engine Refs
  const latestRealPriceRef = useRef<number>(basePrice);
  const currentSecondPriceRef = useRef<number>(basePrice);
  const prevSecondPriceRef = useRef<number>(basePrice);
  const secondStartTimeRef = useRef<number>(Math.floor(Date.now() / 1000) * 1000);
  const ticksRef = useRef<{ price: number; timestamp: number }[]>([]);
  const prevSymbolRef = useRef<string>(symbol);

  // Y-Axis "Breathing" Easing Refs
  const smoothMinPriceRef = useRef<number>(basePrice * 0.9996);
  const smoothMaxPriceRef = useRef<number>(basePrice * 1.0004);

  const lastPriceNotifyRef = useRef<number>(0);
  const reqAnimRef = useRef<number | null>(null);

  // Soft trailing comet aura
  const trailParticlesRef = useRef<{ x: number; y: number; alpha: number; radius: number }[]>([]);

// Cross-browser safe rounded rectangle drawer (Safari / Chrome / Firefox compatible)
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};

  // Mirror the latest contracts into a ref so polling updates don't tear down/restart the render loop
  const activeContractsRef = useRef<BinaryContract[]>(activeContracts);
  useEffect(() => {
    activeContractsRef.current = activeContracts;
  }, [activeContracts]);

// Timeframe-Adaptive Sample Resolution: Keeps visible point density optimal (60-90 points) across all horizons
const getSampleStepMs = (viewSeconds: number): number => {
  if (viewSeconds <= 60) return 1000;        // 10s, 30s, 1m -> 1s step (10 to 60 points)
  if (viewSeconds <= 300) return 4000;       // 5m -> 4s step (75 points)
  if (viewSeconds <= 900) return 12000;      // 15m -> 12s step (75 points)
  if (viewSeconds <= 1800) return 24000;     // 30m -> 24s step (75 points)
  return 48000;                              // 1H -> 48s step (75 points)
};

  // Seed 100% full-width historical window across the entire visible canvas (Zero left gap)
  const seedHistoricalTicks = (price: number, windowMs: number) => {
    if (!price || price <= 0) return;
    const now = Date.now();
    const nowSec = Math.floor(now / 1000) * 1000;
    const viewSec = Math.ceil(windowMs / 1000);
    const stepMs = getSampleStepMs(viewSec);
    // Guarantee enough points to extend well beyond the left edge
    const count = Math.max(60, Math.ceil(windowMs / stepMs) + 30);
    const seeded: { price: number; timestamp: number }[] = [];

    const isCrypto = symbol.endsWith('/USDT');
    const timeScaleFactor = Math.sqrt(stepMs / 1000);
    const stepVol = (isCrypto ? (price > 1000 ? price * 0.00018 : price * 0.00028) : price * 0.00008) * timeScaleFactor;
    const macroAmp = price * (isCrypto ? 0.00045 : 0.00015) * Math.min(3.5, Math.sqrt(Math.max(1, viewSec / 60)));

    // Multi-frequency pure Brownian walk for stochastic micro-variations
    const walk: number[] = [0];
    for (let i = 1; i < count; i++) {
      const step = (Math.random() - 0.495) * stepVol;
      walk.push(walk[i - 1] + step);
    }
    const finalWalk = walk[count - 1];

    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1); // 0 (past) to 1 (now)
      const t = nowSec - (count - 1 - i) * stepMs;
      // Brownian bridge guarantees exactly 0 offset at progress = 1 (current price)
      const brownianBridge = walk[i] - progress * finalWalk;
      // Smooth sinusoidal macro wave modulated so it smoothly meets 0 at progress = 1
      const macroWave = Math.sin(progress * Math.PI * 4) * (macroAmp * 0.7)
                      + Math.cos(progress * Math.PI * 8) * (macroAmp * 0.3);
      const bridgeModulation = Math.sin(progress * Math.PI); // Exactly 0 at progress = 0 and progress = 1

      seeded.push({
        price: Math.max(0.0001, price + brownianBridge + macroWave * bridgeModulation),
        timestamp: t,
      });
    }

    ticksRef.current = seeded;
    prevSecondPriceRef.current = price;
    currentSecondPriceRef.current = price;
    latestRealPriceRef.current = price;
    secondStartTimeRef.current = nowSec;

    // Compute initial Y-axis bounding box
    const prices = seeded.map((s) => s.price);
    smoothMinPriceRef.current = Math.min(...prices) * 0.9997;
    smoothMaxPriceRef.current = Math.max(...prices) * 1.0003;

    // Asynchronously fetch real Binance klines for crypto pairs
    loadKlinesHistory(symbol, price);
  };

  // Load real historical candlestick closes for crypto pairs
  const loadKlinesHistory = async (targetSymbol: string, currentPrice: number) => {
    if (!binanceFeed.isCryptoPair(targetSymbol)) return;
    try {
      const klines = await binanceFeed.fetchKlines(targetSymbol, '1m', 100);
      if (klines && klines.length >= 10) {
        const lastKline = klines[klines.length - 1];
        const priceOffset = currentPrice > 0 && lastKline.price > 0 ? currentPrice - lastKline.price : 0;

        const points: { price: number; timestamp: number }[] = [];
        for (let i = 0; i < klines.length; i++) {
          const k = klines[i];
          const progress = i / (klines.length - 1);
          // Seamlessly transition historical klines into current live price
          const adjustedPrice = k.price + priceOffset * progress;
          points.push({
            price: Math.max(0.0001, adjustedPrice),
            timestamp: k.timestamp,
          });
        }

        if (points.length > 0 && ticksRef.current.length > 0) {
          const oldestExisting = ticksRef.current[0].timestamp;
          const earlierPoints = points.filter((p) => p.timestamp < oldestExisting - 2000);
          if (earlierPoints.length > 0) {
            ticksRef.current = [...earlierPoints, ...ticksRef.current];
            ticksRef.current.sort((a, b) => a.timestamp - b.timestamp);
          }
        }
      }
    } catch {
      // Network fallback silently handled
    }
  };

  // Backfill earlier history backwards if the window duration expands
  const ensureWindowCoverage = (price: number, windowMs: number) => {
    if (!price || price <= 0) return;
    const now = Date.now();
    const windowStart = Math.floor((now - windowMs) / 1000) * 1000;

    if (ticksRef.current.length === 0) {
      seedHistoricalTicks(price, windowMs);
      return;
    }

    const oldestTick = ticksRef.current[0];
    if (oldestTick.timestamp > windowStart - 10000) {
      const missingMs = oldestTick.timestamp - (windowStart - 15000);
      const viewSec = Math.ceil(windowMs / 1000);
      const stepMs = getSampleStepMs(viewSec);
      const count = Math.max(20, Math.floor(missingMs / stepMs));
      const isCrypto = symbol.endsWith('/USDT');
      const timeScaleFactor = Math.sqrt(stepMs / 1000);
      const stepVol = (isCrypto ? (price > 1000 ? price * 0.00016 : price * 0.00025) : price * 0.00007) * timeScaleFactor;
      const macroAmp = price * (isCrypto ? 0.00045 : 0.00015) * Math.min(3.5, Math.sqrt(Math.max(1, viewSec / 60)));

      const walk: number[] = [0];
      for (let i = 1; i < count; i++) {
        const step = (Math.random() - 0.495) * stepVol;
        walk.push(walk[i - 1] + step);
      }
      const finalWalk = walk[count - 1];

      const backfilled: { price: number; timestamp: number }[] = [];
      const connectPrice = oldestTick.price;

      for (let i = 0; i < count; i++) {
        const progress = i / count; // 0 (windowStart - 15s) to 1 (connectPrice)
        const t = (windowStart - 15000) + i * stepMs;
        const brownianBridge = walk[i] - progress * finalWalk;
        const macroWave = Math.sin(progress * Math.PI * 4) * (macroAmp * 0.7)
                        + Math.cos(progress * Math.PI * 8) * (macroAmp * 0.3);
        const bridgeModulation = Math.sin(progress * Math.PI);

        backfilled.push({
          price: Math.max(0.0001, connectPrice + brownianBridge + macroWave * bridgeModulation),
          timestamp: t,
        });
      }

      ticksRef.current = [...backfilled, ...ticksRef.current];
    }
  };

  // Synchronize target price & maintain historical coverage
  useEffect(() => {
    const symbolChanged = symbol !== prevSymbolRef.current;
    if (symbolChanged) {
      prevSymbolRef.current = symbol;
      ticksRef.current = [];
      trailParticlesRef.current = [];
      latestRealPriceRef.current = basePrice;
      currentSecondPriceRef.current = basePrice;
      prevSecondPriceRef.current = basePrice;
    }

    // Check if feed already has cached real price for this symbol
    const cachedReal = binanceFeed.getLatestPrice(symbol);
    if (cachedReal && cachedReal > 0) {
      latestRealPriceRef.current = cachedReal;
    } else if (basePrice > 0 && !latestRealPriceRef.current) {
      latestRealPriceRef.current = basePrice;
    }

    const effectiveViewSeconds = viewExpirySeconds ?? durationSeconds ?? 60;
    const windowDurationMs = Math.max(10000, effectiveViewSeconds * 1000);

    if (ticksRef.current.length === 0 || symbolChanged) {
      seedHistoricalTicks(basePrice, windowDurationMs);
    } else {
      ensureWindowCoverage(basePrice, windowDurationMs);
    }
  }, [symbol, basePrice, viewExpirySeconds, durationSeconds]);

  // Connect directly to multi-tier real-time price streams (Binance WebSocket + REST + Local Backend WS)
  useEffect(() => {
    const unsubTrade = binanceFeed.onTrade((trade) => {
      if (trade.symbol === symbol && trade.price > 0) {
        latestRealPriceRef.current = trade.price;
      }
    });

    const unsubTicker = binanceFeed.onTicker((ticker) => {
      if (ticker.symbol === symbol && ticker.last_price > 0) {
        latestRealPriceRef.current = ticker.last_price;
      }
    });

    const unsubOneSec = binanceFeed.onOneSecondTick((tick) => {
      if (tick.symbol === symbol && tick.price > 0) {
        latestRealPriceRef.current = tick.price;
      }
    });

    // Local Backend Engine Fallback: If external Binance stream is offline/firewalled
    const unsubLocalBackend = wsClient.on<Ticker>('TickerUpdate', (backendTicker) => {
      if (backendTicker.symbol === symbol && backendTicker.last_price > 0) {
        if (!binanceFeed.hasRecentLiveTick(symbol, 2000)) {
          latestRealPriceRef.current = backendTicker.last_price;
        }
      }
    });

    return () => {
      unsubTrade();
      unsubTicker();
      unsubOneSec();
      unsubLocalBackend();
    };
  }, [symbol]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let lastFrameTime = performance.now();
    let pulsePhase = 0;
    const effectiveViewSeconds = viewExpirySeconds ?? durationSeconds ?? 60;
    const effectiveBetSeconds = betExpirySeconds ?? 10;
    // Dynamic sliding window based on selected view expiry (10s, 30s, 1m, 5m, 15m, 30m, 1H)
    const WINDOW_DURATION_MS = Math.max(10000, effectiveViewSeconds * 1000);

    const render = () => {
      const now = Date.now();
      const perfNow = performance.now();
      const frameDelta = Math.min((perfNow - lastFrameTime) / 1000, 0.05);
      lastFrameTime = perfNow;
      pulsePhase = (pulsePhase + frameDelta * 3.2) % (Math.PI * 2);

      // 1. 1-Second Discrete Real Market Trigger (With Anti-Flatline Engine)
      if (now >= secondStartTimeRef.current + 1000) {
        const completedTime = secondStartTimeRef.current;
        const completedPrice = currentSecondPriceRef.current;

        // Push completed 1-second tick to historical buffer
        if (ticksRef.current.length === 0 || ticksRef.current[ticksRef.current.length - 1].timestamp < completedTime) {
          ticksRef.current.push({ price: completedPrice, timestamp: completedTime });
        }

        prevSecondPriceRef.current = completedPrice;
        secondStartTimeRef.current += 1000;

        // Re-align if clock drifted or tab was inactive
        if (now - secondStartTimeRef.current > 2500) {
          secondStartTimeRef.current = Math.floor(now / 1000) * 1000;
        }

        // Determine next 1-second target price:
        let rawTarget = latestRealPriceRef.current > 0 ? latestRealPriceRef.current : basePrice;
        let nextPrice = rawTarget;

        // Anti-Flatline Rule:
        // If the price would be identical to previous second (or feed paused/static),
        // apply natural micro-movement so the live curve always flows realistically.
        const isIdentical = Math.abs(nextPrice - completedPrice) < 0.000001;
        const hasLiveTrade = binanceFeed.hasRecentLiveTick(symbol, 2000);

        if (isIdentical || !hasLiveTrade) {
          const isCrypto = symbol.endsWith('/USDT');
          const volScale = isCrypto ? (nextPrice > 1000 ? 0.00008 : 0.00015) : 0.00005;
          const randomFactor = (Math.random() - 0.495);
          const rawDelta = completedPrice * volScale * randomFactor;
          const minStep = completedPrice < 1 ? 0.0001 : (completedPrice < 10 ? 0.001 : (completedPrice < 1000 ? 0.02 : 0.50));
          const appliedDelta = Math.abs(rawDelta) < minStep ? (Math.random() > 0.5 ? minStep : -minStep) : rawDelta;
          nextPrice = Math.max(0.0001, completedPrice + appliedDelta);
          const decimals = symbol.includes('EURO') || symbol.includes('EUR') || nextPrice < 10 ? 4 : 2;
          nextPrice = Number(nextPrice.toFixed(decimals));
          latestRealPriceRef.current = nextPrice;
        }

        currentSecondPriceRef.current = nextPrice;

        // Notify parent widget immediately on 1-second boundary
        if (onPriceUpdate) {
          onPriceUpdate(nextPrice);
        }

        // Maintain a rich 2-hour multi-timeframe memory buffer
        const maxBufferDuration = Math.max(7200000, WINDOW_DURATION_MS + 60000);
        const cutoff = now - maxBufferDuration;
        ticksRef.current = ticksRef.current.filter((t) => t.timestamp >= cutoff);
      }

      // 2. Smooth Intra-Second Continuous Hermite Ease (Continuous Flow across 1.0s)
      const intraProgress = Math.max(0, Math.min(1, (now - secondStartTimeRef.current) / 1000));
      const eased = 3 * intraProgress * intraProgress - 2 * intraProgress * intraProgress * intraProgress;
      const curPrice = Math.max(0.0001, prevSecondPriceRef.current + (currentSecondPriceRef.current - prevSecondPriceRef.current) * eased);

      // Throttled notification
      if (perfNow - lastPriceNotifyRef.current > 100) {
        lastPriceNotifyRef.current = perfNow;
        if (onPriceUpdate) onPriceUpdate(curPrice);
      }

      // 4. HiDPI Retina Resolution
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Layout geometry
      const paddingRight = 75;
      const paddingLeft = 0;
      const paddingTop = 25;
      const paddingBottom = 26;
      const chartWidth = width - paddingRight - paddingLeft;
      const chartHeight = height - paddingTop - paddingBottom;
      const liveChartWidth = chartWidth * 0.92;

      // 5. Y-Axis "Breathing" Scale Easing (Computed strictly from visible window points)
      const ticks = ticksRef.current;
      const visibleCutoff = now - WINDOW_DURATION_MS - 2000;
      const visibleTicks = ticks.filter((t) => t.timestamp >= visibleCutoff);
      const visiblePrices = (visibleTicks.length > 0 ? visibleTicks.map((t) => t.price) : [curPrice]).concat(curPrice);
      const activeStrikes = activeContractsRef.current
        .filter((c) => c.symbol === symbol)
        .map((c) => c.strike_price);
      const allPrices = visiblePrices.concat(activeStrikes);

      const rawMin = Math.min(...allPrices);
      const rawMax = Math.max(...allPrices);
      const centerPrice = curPrice;
      const minHalfRange = centerPrice * (effectiveViewSeconds <= 60 ? 0.0003 : 0.0008);
      const targetMin = Math.min(rawMin * 0.9998, centerPrice - minHalfRange);
      const targetMax = Math.max(rawMax * 1.0002, centerPrice + minHalfRange);

      const yEaseRate = 3.8;
      smoothMinPriceRef.current += (targetMin - smoothMinPriceRef.current) * Math.min(yEaseRate * frameDelta, 1.0);
      smoothMaxPriceRef.current += (targetMax - smoothMaxPriceRef.current) * Math.min(yEaseRate * frameDelta, 1.0);

      const minPrice = smoothMinPriceRef.current;
      const maxPrice = smoothMaxPriceRef.current;
      const priceRange = maxPrice - minPrice || 1;

      const getY = (p: number) => paddingTop + chartHeight - ((p - minPrice) / priceRange) * chartHeight;

      // Time-to-Pixel mapping
      const windowStart = now - WINDOW_DURATION_MS;
      const getX = (timestamp: number) => {
        const progress = (timestamp - windowStart) / WINDOW_DURATION_MS;
        return paddingLeft + progress * liveChartWidth;
      };

      // 6. Draw Horizontal Price Grid Lines & Labels
      const gridCount = 6;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = isDark ? '#232B3B' : '#F1F5F9';
      ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const decimals = symbol.includes('EURO') || symbol.includes('EUR') || basePrice < 10 ? 4 : 2;

      for (let i = 0; i <= gridCount; i++) {
        const p = minPrice + (i / gridCount) * priceRange;
        const y = getY(p);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        ctx.fillText(p.toFixed(decimals), width - paddingRight + 8, y);
      }

      // 7. Draw Purchase Time & Expiration Settlement Zone
      const purchaseX = paddingLeft + chartWidth * 0.92;
      const expiryX = paddingLeft + chartWidth * 0.98;

      // Diagonal hatch pattern
      ctx.save();
      ctx.beginPath();
      ctx.rect(purchaseX, paddingTop, expiryX - purchaseX, chartHeight);
      ctx.clip();
      ctx.strokeStyle = isDark ? '#2E384D' : '#E2E8F0';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      for (let x = purchaseX - chartHeight; x < expiryX + chartHeight; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, paddingTop + chartHeight);
        ctx.lineTo(x + chartHeight, paddingTop);
        ctx.stroke();
      }
      ctx.restore();

      // Purchase vertical dashed line
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isDark ? '#3B82F6' : '#2563EB';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(purchaseX, paddingTop - 5);
      ctx.lineTo(purchaseX, paddingTop + chartHeight);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#60A5FA' : '#2563EB';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Purchase Time', purchaseX - 4, paddingTop - 8);

      // Expiration vertical dashed line & badge
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isDark ? '#F59E0B' : '#D97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(expiryX, paddingTop - 5);
      ctx.lineTo(expiryX, paddingTop + chartHeight);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#F59E0B' : '#D97706';
      drawRoundedRect(ctx, expiryX - 28, paddingTop - 20, 56, 15, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXPIRATION', expiryX, paddingTop - 9.5);

      // 8. Extract visible camera points covering 100% full width with adaptive step
      const headX = paddingLeft + liveChartWidth;
      const headY = getY(curPrice);
      const stepMs = getSampleStepMs(effectiveViewSeconds);

      const rawVisible: { x: number; y: number }[] = [];
      let lastSampledTime = 0;

      for (let i = 0; i < ticks.length; i++) {
        const t = ticks[i];
        const x = getX(t.timestamp);
        if (x >= paddingLeft - 50 && x <= headX - 2) {
          if (lastSampledTime === 0 || t.timestamp - lastSampledTime >= stepMs) {
            rawVisible.push({ x, y: getY(t.price) });
            lastSampledTime = t.timestamp;
          }
        }
      }
      rawVisible.push({ x: headX, y: headY });

      // Deduplicate close x coordinates for math stability
      const visible: { x: number; y: number }[] = [];
      for (let i = 0; i < rawVisible.length; i++) {
        if (i === 0 || rawVisible[i].x - visible[visible.length - 1].x >= 1.2) {
          visible.push(rawVisible[i]);
        } else if (i === rawVisible.length - 1) {
          // If the head is within 1.2px of the previous point, replace it with the exact head position
          visible[visible.length - 1] = rawVisible[i];
        }
      }
      if (visible.length > 0 && visible[visible.length - 1].x !== headX) {
        visible.push({ x: headX, y: headY });
      }

      if (visible.length >= 2) {
        ctx.setLineDash([]);

        // Monotone Cubic Hermite Spline (Fritsch-Carlson)
        const n = visible.length;
        const dx: number[] = [];
        const dy: number[] = [];
        const delta: number[] = [];

        for (let i = 0; i < n - 1; i++) {
          dx[i] = visible[i + 1].x - visible[i].x;
          dy[i] = visible[i + 1].y - visible[i].y;
          delta[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0;
        }

        const m: number[] = new Array(n);
        m[0] = delta[0];
        m[n - 1] = delta[n - 2];

        for (let i = 1; i < n - 1; i++) {
          if (delta[i - 1] * delta[i] <= 0) {
            m[i] = 0;
          } else {
            m[i] = (delta[i - 1] + delta[i]) / 2;
          }
        }

        for (let i = 0; i < n - 1; i++) {
          if (delta[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
          } else {
            const a = m[i] / delta[i];
            const b = m[i + 1] / delta[i];
            const dist = a * a + b * b;
            if (dist > 9) {
              const tau = 3 / Math.sqrt(dist);
              m[i] = tau * a * delta[i];
              m[i + 1] = tau * b * delta[i];
            }
          }
        }

        // Build continuous cubic Bézier paths independently (Safe for Safari / WebKit)
        const splinePath = new Path2D();
        const areaPath = new Path2D();

        splinePath.moveTo(visible[0].x, visible[0].y);
        areaPath.moveTo(visible[0].x, visible[0].y);

        for (let i = 0; i < n - 1; i++) {
          const p0 = visible[i];
          const p1 = visible[i + 1];
          const segDx = dx[i];

          const cp1x = p0.x + segDx / 3;
          const cp1y = p0.y + (m[i] * segDx) / 3;
          const cp2x = p1.x - segDx / 3;
          const cp2y = p1.y - (m[i + 1] * segDx) / 3;

          splinePath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
          areaPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
        }

        // 9. Gradient Area Fill under Spline (Closed down to bottom baseline)
        areaPath.lineTo(headX, paddingTop + chartHeight);
        areaPath.lineTo(visible[0].x, paddingTop + chartHeight);
        areaPath.closePath();

        const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
        grad.addColorStop(0, isDark ? 'rgba(20, 184, 166, 0.38)' : 'rgba(11, 59, 60, 0.24)');
        grad.addColorStop(1, isDark ? 'rgba(20, 184, 166, 0.0)' : 'rgba(11, 59, 60, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill(areaPath);

        // 10. Soft Leading Glow Beam
        const glowWidth = Math.min(120, liveChartWidth);
        const headGlow = ctx.createLinearGradient(headX - glowWidth, 0, headX, 0);
        headGlow.addColorStop(0, 'rgba(20, 184, 166, 0.0)');
        headGlow.addColorStop(1, isDark ? 'rgba(20, 184, 166, 0.25)' : 'rgba(11, 59, 60, 0.18)');
        ctx.fillStyle = headGlow;
        ctx.fill(areaPath);

        // 11. Dual-Pass Optical Feather Glow Stroke
        ctx.lineWidth = 5.5;
        ctx.strokeStyle = isDark ? 'rgba(20, 184, 166, 0.22)' : 'rgba(11, 59, 60, 0.18)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(splinePath);

        // Crisp Core Spline Stroke
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = isDark ? '#14B8A6' : '#0B3B3C';
        ctx.stroke(splinePath);
      }

      // 12. Active Binary Contracts Strike Lines with Live Countdown Badge & Viewport Clamping
      activeContractsRef.current.forEach((c) => {
        const isCall = c.direction === 'Call';
        const rawStrikeY = getY(c.strike_price);
        const isWinning = isCall ? curPrice > c.strike_price : curPrice < c.strike_price;

        const isOffscreenTop = rawStrikeY < paddingTop;
        const isOffscreenBottom = rawStrikeY > paddingTop + chartHeight;
        const isOffscreen = isOffscreenTop || isOffscreenBottom;

        // Dynamic Remaining Countdown & Duration calculations
        const expireTimeMs = new Date(c.expires_at).getTime();
        const remainingSec = Math.max(0, Math.ceil((expireTimeMs - now) / 1000));
        const totalSec = c.duration_seconds || 10;
        const durationLabel = totalSec >= 60 && totalSec % 60 === 0 ? `${totalSec / 60}m` : `${totalSec}s`;
        const remainingLabel = remainingSec > 0 
          ? (remainingSec >= 60 
              ? `${Math.floor(remainingSec / 60)}:${(remainingSec % 60).toString().padStart(2, '0')}` 
              : `${remainingSec}s`)
          : '0s';

        ctx.save();

        // If strike line is visible in canvas, draw horizontal dashed line
        if (!isOffscreen) {
          ctx.setLineDash([5, 3]);
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = isWinning ? '#10B981' : isCall ? '#10B981' : '#EF4444';
          ctx.beginPath();
          ctx.moveTo(paddingLeft, rawStrikeY);
          ctx.lineTo(width - paddingRight, rawStrikeY);
          ctx.stroke();
        }

        // Integrated Exchange Pill Badge Geometry
        const badgeWidth = isOffscreen ? 168 : 148;
        const badgeHeight = 22;
        const badgeX = Math.max(paddingLeft + 10, liveChartWidth - badgeWidth - 10);
        const badgeY = Math.max(
          paddingTop + 2,
          Math.min(paddingTop + chartHeight - badgeHeight - 2, rawStrikeY - badgeHeight / 2)
        );
        const centerY = badgeY + badgeHeight / 2;

        // Dynamic Glow
        ctx.shadowColor = isWinning ? 'rgba(16, 185, 129, 0.6)' : isCall ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.4)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = isCall ? '#10B981' : '#EF4444';
        drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6);
        ctx.fill();

        // Reset shadow for crisp text rendering
        ctx.shadowBlur = 0;

        // Left Section: Direction & Stake (e.g. ▲ CALL $50)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 9.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const dirIcon = isOffscreenTop ? '↑' : isOffscreenBottom ? '↓' : isCall ? '▲' : '▼';
        ctx.fillText(`${dirIcon} ${c.direction.toUpperCase()} $${c.stake_usd}`, badgeX + 7, centerY);

        // Translucent Divider
        const dividerX = badgeX + 72;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dividerX, badgeY + 4);
        ctx.lineTo(dividerX, badgeY + badgeHeight - 4);
        ctx.stroke();

        // Right Section: Live Countdown Clock & Duration (e.g. ⏱ 7s / 10s or ⏱ Settling...)
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        if (remainingSec === 0) {
          ctx.fillText(`⏱ Settling...`, dividerX + 6, centerY);
        } else {
          ctx.fillText(`⏱ ${remainingLabel}/${durationLabel}`, dividerX + 6, centerY);
        }

        ctx.restore();
      });

      // 13. Horizontal Live Price Tracker Line
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? '#14B8A6' : '#0B3B3C';
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(width - paddingRight, headY);
      ctx.stroke();

      // Right Axis Live Price Badge
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#14B8A6' : '#0B3B3C';
      drawRoundedRect(ctx, width - paddingRight + 2, headY - 10, 68, 20, 4);
      ctx.fill();
      ctx.fillStyle = isDark ? '#0B0E14' : '#FFFFFF';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(curPrice.toFixed(decimals), width - paddingRight + 36, headY + 3.5);

      // 14. Leading Live Radar Head (Particle emission + harmonic pulse)
      if (Math.random() < 0.35) {
        trailParticlesRef.current.push({
          x: headX - Math.random() * 6,
          y: headY + (Math.random() - 0.5) * 5,
          alpha: 0.65,
          radius: 2 + Math.random() * 2,
        });
      }

      for (let i = trailParticlesRef.current.length - 1; i >= 0; i--) {
        const p = trailParticlesRef.current[i];
        p.alpha -= frameDelta * 1.6;
        p.x -= frameDelta * 24;
        if (p.alpha <= 0) {
          trailParticlesRef.current.splice(i, 1);
        } else {
          ctx.fillStyle = isDark ? `rgba(20, 184, 166, ${p.alpha})` : `rgba(11, 59, 60, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Harmonic Pulsing Radar Circle
      const pulseSize = 6 + Math.sin(pulsePhase) * 4;
      const pulseAlpha = 0.35 - Math.sin(pulsePhase) * 0.22;

      ctx.fillStyle = isDark ? `rgba(20, 184, 166, ${pulseAlpha})` : `rgba(11, 59, 60, ${pulseAlpha})`;
      ctx.beginPath();
      ctx.arc(headX, headY, pulseSize + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? 'rgba(20, 184, 166, 0.45)' : 'rgba(11, 59, 60, 0.45)';
      ctx.beginPath();
      ctx.arc(headX, headY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = isDark ? '#14B8A6' : '#0B3B3C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(headX, headY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 15. Bottom Rolling Time Axis Marks
      const timeMarksCount = 5;
      ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
      ctx.font = '600 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let i = 0; i < timeMarksCount; i++) {
        const markTime = windowStart + (i / (timeMarksCount - 1)) * WINDOW_DURATION_MS;
        const d = new Date(markTime);
        const timeStr = effectiveViewSeconds >= 1800 
          ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
          : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
        const markX = paddingLeft + (i / (timeMarksCount - 1)) * liveChartWidth;
        ctx.fillText(timeStr, markX, height - 16);
      }

      // Expiry notice right aligned
      const formatExpiryBadge = (sec: number) => {
        if (sec >= 3600) return `+${sec / 3600}H`;
        if (sec >= 60) return `+${sec / 60}m`;
        return `+${sec}s`;
      };
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Expires: ${formatExpiryBadge(effectiveBetSeconds)}`, width - 4, height - 16);

      ctx.restore();
      reqAnimRef.current = requestAnimationFrame(render);
    };

    reqAnimRef.current = requestAnimationFrame(render);

    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    };
  }, [isDark, isDashboard, durationSeconds, viewExpirySeconds, betExpirySeconds, onPriceUpdate]);

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
