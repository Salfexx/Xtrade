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

  // High-Frequency 200ms Micro-Step & Momentum Engine Refs (Expert Option style)
  const latestRealPriceRef = useRef<number>(basePrice);
  const currentMicroPriceRef = useRef<number>(basePrice);
  const prevMicroPriceRef = useRef<number>(basePrice);
  const microStartTimeRef = useRef<number>(Date.now());
  const momentumVelRef = useRef<number>(0);
  const ticksRef = useRef<{ price: number; timestamp: number }[]>([]);
  const prevSymbolRef = useRef<string>(symbol);

  // Y-Axis "Breathing" Easing Refs
  const smoothMinPriceRef = useRef<number>(basePrice * 0.9996);
  const smoothMaxPriceRef = useRef<number>(basePrice * 1.0004);

  const lastPriceNotifyRef = useRef<number>(0);
  const reqAnimRef = useRef<number | null>(null);

  // Soft trailing comet sparks aura
  const trailParticlesRef = useRef<{ x: number; y: number; alpha: number; radius: number }[]>([]);

  // Cross-browser safe rounded rectangle drawer
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

  // Mirror active contracts into ref so updates don't reset the render loop
  const activeContractsRef = useRef<BinaryContract[]>(activeContracts);
  useEffect(() => {
    activeContractsRef.current = activeContracts;
  }, [activeContracts]);

  // Timeframe-Adaptive Sample Resolution (density optimal for smooth curve)
  const getSampleStepMs = (viewSeconds: number): number => {
    if (viewSeconds <= 30) return 400;      // 10s, 30s -> 400ms step
    if (viewSeconds <= 60) return 800;      // 1m -> 800ms step
    if (viewSeconds <= 300) return 3000;    // 5m -> 3s step
    if (viewSeconds <= 900) return 10000;   // 15m -> 10s step
    if (viewSeconds <= 1800) return 20000;  // 30m -> 20s step
    return 40000;                           // 1H -> 40s step
  };

  // Seed 100% full-width historical window across visible canvas
  const seedHistoricalTicks = (price: number, windowMs: number) => {
    if (!price || price <= 0) return;
    const now = Date.now();
    const viewSec = Math.ceil(windowMs / 1000);
    const stepMs = getSampleStepMs(viewSec);
    const count = Math.max(60, Math.ceil(windowMs / stepMs) + 30);
    const seeded: { price: number; timestamp: number }[] = [];

    const isCrypto = symbol.endsWith('/USDT');
    const timeScaleFactor = Math.sqrt(stepMs / 1000);
    const stepVol = (isCrypto ? (price > 1000 ? price * 0.00018 : price * 0.00028) : price * 0.00008) * timeScaleFactor;
    const macroAmp = price * (isCrypto ? 0.00045 : 0.00015) * Math.min(3.5, Math.sqrt(Math.max(1, viewSec / 60)));

    // Multi-frequency pure Brownian walk
    const walk: number[] = [0];
    for (let i = 1; i < count; i++) {
      const step = (Math.random() - 0.495) * stepVol;
      walk.push(walk[i - 1] + step);
    }
    const finalWalk = walk[count - 1];

    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const t = now - (count - 1 - i) * stepMs;
      const brownianBridge = walk[i] - progress * finalWalk;
      const macroWave = Math.sin(progress * Math.PI * 4) * (macroAmp * 0.7)
                      + Math.cos(progress * Math.PI * 8) * (macroAmp * 0.3);
      const bridgeModulation = Math.sin(progress * Math.PI);

      seeded.push({
        price: Math.max(0.0001, price + brownianBridge + macroWave * bridgeModulation),
        timestamp: t,
      });
    }

    ticksRef.current = seeded;
    prevMicroPriceRef.current = price;
    currentMicroPriceRef.current = price;
    latestRealPriceRef.current = price;
    microStartTimeRef.current = now;
    momentumVelRef.current = 0;

    const prices = seeded.map((s) => s.price);
    smoothMinPriceRef.current = Math.min(...prices) * 0.9997;
    smoothMaxPriceRef.current = Math.max(...prices) * 1.0003;

    loadKlinesHistory(symbol, price);
  };

  // Asynchronously load historical candlestick closes for crypto pairs
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
      // Fallback handled
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
      currentMicroPriceRef.current = basePrice;
      prevMicroPriceRef.current = basePrice;
      microStartTimeRef.current = Date.now();
      momentumVelRef.current = 0;
    }

    const cachedReal = binanceFeed.getLatestPrice(symbol);
    if (cachedReal && cachedReal > 0) {
      latestRealPriceRef.current = cachedReal;
    } else if (basePrice > 0 && !latestRealPriceRef.current) {
      latestRealPriceRef.current = basePrice;
    }

    const effectiveView = viewExpirySeconds ?? durationSeconds ?? 60;
    const windowMs = Math.max(10000, effectiveView * 1000);
    seedHistoricalTicks(latestRealPriceRef.current || basePrice, windowMs);

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

    const unsubWs = wsClient.on<Ticker>('TickerUpdate', (data) => {
      if (data?.symbol === symbol && data?.last_price > 0) {
        if (!binanceFeed.hasRecentLiveTick(symbol, 2000)) {
          latestRealPriceRef.current = data.last_price;
        }
      }
    });

    return () => {
      unsubTrade();
      unsubTicker();
      unsubOneSec();
      unsubWs();
    };
  }, [symbol, basePrice, viewExpirySeconds, durationSeconds]);

  // Master 60-120 FPS Expert Option Render Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let lastFrameTime = performance.now();
    let pulsePhase = 0;
    const effectiveViewSeconds = viewExpirySeconds ?? durationSeconds ?? 60;
    const effectiveBetSeconds = betExpirySeconds ?? 10;
    const WINDOW_DURATION_MS = Math.max(10000, effectiveViewSeconds * 1000);
    const MICRO_STEP_MS = 220; // High-frequency 220ms Expert Option sub-step interval (~4.5 Hz)

    const render = () => {
      const now = Date.now();
      const perfNow = performance.now();
      const frameDelta = Math.min((perfNow - lastFrameTime) / 1000, 0.05);
      lastFrameTime = perfNow;
      pulsePhase = (pulsePhase + frameDelta * 3.6) % (Math.PI * 2);

      // 1. High-Frequency Micro-Step Trigger (~220ms Sub-Tick with Momentum Inertia)
      if (now >= microStartTimeRef.current + MICRO_STEP_MS) {
        const completedTime = microStartTimeRef.current;
        const completedPrice = currentMicroPriceRef.current;

        // Push completed micro-tick to historical memory
        if (ticksRef.current.length === 0 || ticksRef.current[ticksRef.current.length - 1].timestamp < completedTime) {
          ticksRef.current.push({ price: completedPrice, timestamp: completedTime });
        }

        prevMicroPriceRef.current = completedPrice;
        microStartTimeRef.current = now;

        // Determine next micro-target price
        let anchorPrice = latestRealPriceRef.current > 0 ? latestRealPriceRef.current : basePrice;
        const isCrypto = symbol.endsWith('/USDT');
        const volScale = isCrypto ? (anchorPrice > 1000 ? 0.000035 : 0.00006) : 0.00002;
        
        // Ornstein-Uhlenbeck mean-reversion pull towards anchor price
        const meanDiff = anchorPrice - completedPrice;
        const meanRevertPull = meanDiff * 0.35; // 35% pull per micro-step towards true anchor
        
        // Random Brownian impulse + Momentum inertia
        const noise = (Math.random() - 0.495) * anchorPrice * volScale;
        momentumVelRef.current = momentumVelRef.current * 0.55 + noise * 0.45;

        let nextPrice = completedPrice + meanRevertPull + momentumVelRef.current;
        const minStep = anchorPrice < 1 ? 0.00005 : (anchorPrice < 10 ? 0.0005 : (anchorPrice < 1000 ? 0.01 : 0.20));
        
        if (Math.abs(nextPrice - completedPrice) < minStep * 0.2) {
          nextPrice += (Math.random() > 0.5 ? minStep : -minStep) * 0.5;
        }

        const decimals = symbol.includes('EURO') || symbol.includes('EUR') || nextPrice < 10 ? 4 : 2;
        nextPrice = Number(Math.max(0.0001, nextPrice).toFixed(decimals));

        currentMicroPriceRef.current = nextPrice;

        if (onPriceUpdate && perfNow - lastPriceNotifyRef.current > 120) {
          lastPriceNotifyRef.current = perfNow;
          onPriceUpdate(nextPrice);
        }

        // Maintain a rich 2-hour multi-timeframe memory buffer
        const maxBufferDuration = Math.max(7200000, WINDOW_DURATION_MS + 60000);
        const cutoff = now - maxBufferDuration;
        ticksRef.current = ticksRef.current.filter((t) => t.timestamp >= cutoff);
      }

      // 2. Continuous Hermite Spline Ease (Continuous Silk Glide across 220ms)
      const microProgress = Math.max(0, Math.min(1, (now - microStartTimeRef.current) / MICRO_STEP_MS));
      const eased = 3 * microProgress * microProgress - 2 * microProgress * microProgress * microProgress;
      const curPrice = Math.max(0.0001, prevMicroPriceRef.current + (currentMicroPriceRef.current - prevMicroPriceRef.current) * eased);

      // Throttled notification for widget UI header
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

      // 5. Y-Axis "Breathing" Scale Easing (Elastic dampening with optimal padding)
      const ticks = ticksRef.current;
      const visibleCutoff = now - WINDOW_DURATION_MS - 1500;
      const visibleTicks = ticks.filter((t) => t.timestamp >= visibleCutoff);
      const visiblePrices = (visibleTicks.length > 0 ? visibleTicks.map((t) => t.price) : [curPrice]).concat(curPrice);
      const activeStrikes = activeContractsRef.current
        .filter((c) => c.symbol === symbol)
        .map((c) => c.strike_price);
      const allPrices = visiblePrices.concat(activeStrikes);

      const rawMin = Math.min(...allPrices);
      const rawMax = Math.max(...allPrices);
      const centerPrice = curPrice;
      const minHalfRange = centerPrice * (effectiveViewSeconds <= 30 ? 0.00025 : (effectiveViewSeconds <= 60 ? 0.0004 : 0.0008));
      const targetMin = Math.min(rawMin * 0.99985, centerPrice - minHalfRange);
      const targetMax = Math.max(rawMax * 1.00015, centerPrice + minHalfRange);

      const yEaseRate = 4.2;
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
      ctx.strokeStyle = isDark ? '#1E293B' : '#F1F5F9';
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

      // 7. Draw Purchase Time & Expiration Settlement Zone (Expert Option hatch pattern)
      const purchaseX = paddingLeft + chartWidth * 0.92;
      const expiryX = paddingLeft + chartWidth * 0.98;

      // Diagonal hatch pattern
      ctx.save();
      ctx.beginPath();
      ctx.rect(purchaseX, paddingTop, expiryX - purchaseX, chartHeight);
      ctx.clip();
      ctx.strokeStyle = isDark ? '#1E293B' : '#E2E8F0';
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
          visible[visible.length - 1] = rawVisible[i];
        }
      }
      if (visible.length > 0 && visible[visible.length - 1].x !== headX) {
        visible.push({ x: headX, y: headY });
      }

      // Neon Emerald / Cyan Palette (Expert Option Style)
      const neonEmerald = isDark ? '#00F090' : '#059669';
      const neonAura = isDark ? 'rgba(0, 240, 144, 0.28)' : 'rgba(5, 150, 105, 0.22)';

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

        // Build continuous cubic Bézier paths
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

        // 9. Gradient Area Fill under Spline (Expert Option multi-stop glow)
        areaPath.lineTo(headX, paddingTop + chartHeight);
        areaPath.lineTo(visible[0].x, paddingTop + chartHeight);
        areaPath.closePath();

        const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
        grad.addColorStop(0, isDark ? 'rgba(0, 240, 144, 0.32)' : 'rgba(5, 150, 105, 0.22)');
        grad.addColorStop(0.6, isDark ? 'rgba(0, 240, 144, 0.08)' : 'rgba(5, 150, 105, 0.05)');
        grad.addColorStop(1, 'rgba(0, 240, 144, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill(areaPath);

        // 10. Leading Searchlight Glow Beam
        const glowWidth = Math.min(140, liveChartWidth);
        const headGlow = ctx.createLinearGradient(headX - glowWidth, 0, headX, 0);
        headGlow.addColorStop(0, 'rgba(0, 240, 144, 0.0)');
        headGlow.addColorStop(1, isDark ? 'rgba(0, 240, 144, 0.22)' : 'rgba(5, 150, 105, 0.16)');
        ctx.fillStyle = headGlow;
        ctx.fill(areaPath);

        // 11. Dual-Pass Optical Feather Glow Stroke
        ctx.lineWidth = 5.5;
        ctx.strokeStyle = neonAura;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(splinePath);

        // Crisp Core Spline Stroke
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = neonEmerald;
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

        if (!isOffscreen) {
          ctx.setLineDash([5, 3]);
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = isWinning ? '#10B981' : isCall ? '#10B981' : '#EF4444';
          ctx.beginPath();
          ctx.moveTo(paddingLeft, rawStrikeY);
          ctx.lineTo(width - paddingRight, rawStrikeY);
          ctx.stroke();
        }

        const badgeWidth = isOffscreen ? 168 : 148;
        const badgeHeight = 22;
        const badgeX = Math.max(paddingLeft + 10, liveChartWidth - badgeWidth - 10);
        const badgeY = Math.max(
          paddingTop + 2,
          Math.min(paddingTop + chartHeight - badgeHeight - 2, rawStrikeY - badgeHeight / 2)
        );
        const centerY = badgeY + badgeHeight / 2;

        ctx.shadowColor = isWinning ? 'rgba(16, 185, 129, 0.65)' : isCall ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.45)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = isCall ? '#10B981' : '#EF4444';
        drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 9.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const dirIcon = isOffscreenTop ? '↑' : isOffscreenBottom ? '↓' : isCall ? '▲' : '▼';
        ctx.fillText(`${dirIcon} ${c.direction.toUpperCase()} $${c.stake_usd}`, badgeX + 7, centerY);

        const dividerX = badgeX + 72;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dividerX, badgeY + 4);
        ctx.lineTo(dividerX, badgeY + badgeHeight - 4);
        ctx.stroke();

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
      ctx.strokeStyle = neonEmerald;
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(width - paddingRight, headY);
      ctx.stroke();

      // Right Axis Live Price Badge (Expert Option neon pill)
      ctx.setLineDash([]);
      ctx.fillStyle = neonEmerald;
      ctx.shadowColor = neonAura;
      ctx.shadowBlur = 8;
      drawRoundedRect(ctx, width - paddingRight + 2, headY - 10, 68, 20, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = isDark ? '#0B0E14' : '#FFFFFF';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(curPrice.toFixed(decimals), width - paddingRight + 36, headY + 3.5);

      // 14. Signature Expert Option Laser Head & Expanding Multi-Ring Radar Ripples
      if (Math.random() < 0.45) {
        trailParticlesRef.current.push({
          x: headX - Math.random() * 5,
          y: headY + (Math.random() - 0.5) * 4,
          alpha: 0.7,
          radius: 1.8 + Math.random() * 2,
        });
      }

      for (let i = trailParticlesRef.current.length - 1; i >= 0; i--) {
        const p = trailParticlesRef.current[i];
        p.alpha -= frameDelta * 1.8;
        p.x -= frameDelta * 26;
        if (p.alpha <= 0) {
          trailParticlesRef.current.splice(i, 1);
        } else {
          ctx.fillStyle = isDark ? `rgba(0, 240, 144, ${p.alpha})` : `rgba(5, 150, 105, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Outer Expanding Radar Shockwave 1
      const wave1Progress = (pulsePhase / (Math.PI * 2));
      const wave1Radius = 5 + wave1Progress * 22;
      const wave1Alpha = (1 - wave1Progress) * 0.55;
      ctx.strokeStyle = isDark ? `rgba(0, 240, 144, ${wave1Alpha})` : `rgba(5, 150, 105, ${wave1Alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(headX, headY, wave1Radius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Expanding Radar Shockwave 2 (offset by 0.5 phase)
      const wave2Progress = ((pulsePhase + Math.PI) / (Math.PI * 2)) % 1;
      const wave2Radius = 5 + wave2Progress * 22;
      const wave2Alpha = (1 - wave2Progress) * 0.45;
      ctx.strokeStyle = isDark ? `rgba(0, 240, 144, ${wave2Alpha})` : `rgba(5, 150, 105, ${wave2Alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(headX, headY, wave2Radius, 0, Math.PI * 2);
      ctx.stroke();

      // Middle Glowing Halo
      ctx.fillStyle = isDark ? 'rgba(0, 240, 144, 0.35)' : 'rgba(5, 150, 105, 0.3)';
      ctx.beginPath();
      ctx.arc(headX, headY, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core White Laser Pin
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = neonEmerald;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(headX, headY, 3.8, 0, Math.PI * 2);
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

      // Expiry badge right aligned
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
