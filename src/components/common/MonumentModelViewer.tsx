import React, { useState, useEffect, useRef } from 'react';
import { Site, SiteModel } from '../../types';
import { Play, Pause, RotateCw, AlertCircle } from 'lucide-react';

// Import model-viewer web component locally from npm
import '@google/model-viewer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, any>;
    }
  }
  namespace React.JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, any>;
    }
  }
}

interface MonumentModelViewerProps {
  models: SiteModel[];
  getSiteById: (id: string) => Site | undefined;
  onSelectSite: (site: Site) => void;
}

export const MonumentModelViewer: React.FC<MonumentModelViewerProps> = ({
  models,
  getSiteById,
  onSelectSite,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [isPosterOnly, setIsPosterOnly] = useState(false);
  const [glbLoadError, setGlbLoadError] = useState(false);
  const [theta, setTheta] = useState(0);
  const [phi, setPhi] = useState(75);

  const containerRef = useRef<HTMLDivElement>(null);
  const modelViewerRef = useRef<any>(null);

  const activeModel = models[activeIndex] || models[0];
  const site = activeModel ? getSiteById(activeModel.site_id) : undefined;

  // 1. Accessibility & system checks: Reduced motion, Data Saver, WebGL
  useEffect(() => {
    const checkPosterOnly = () => {
      // Reduced motion
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      // Save-Data
      const saveData = (navigator as any).connection?.saveData === true;
      // WebGL availability
      let webglAvailable = false;
      try {
        const canvas = document.createElement('canvas');
        webglAvailable = !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
      } catch {
        webglAvailable = false;
      }

      if (reducedMotion || saveData || !webglAvailable) {
        setIsPosterOnly(true);
      }
    };

    checkPosterOnly();

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsPosterOnly(true);
    };
    motionQuery?.addEventListener?.('change', handleMotionChange);

    return () => {
      motionQuery?.removeEventListener?.('change', handleMotionChange);
    };
  }, []);

  // 2. Idle callback: only load 3D engine after page is interactive
  useEffect(() => {
    if (isPosterOnly) return;

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(
        () => setIsInteractive(true),
        { timeout: 1500 }
      );
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => setIsInteractive(true), 250);
      return () => clearTimeout(timer);
    }
  }, [isPosterOnly]);

  // 3. Intersection Observer: pause rendering when off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        setIsVisible(entry?.isIntersecting ?? false);
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 4. Page visibility change: pause rendering when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 5. Check if GLB exists and reset errors when active model changes
  useEffect(() => {
    setGlbLoadError(false);
    if (!activeModel?.glb_path) {
      setGlbLoadError(true);
      return;
    }
    const path = activeModel.glb_path.startsWith('/') ? activeModel.glb_path : '/' + activeModel.glb_path;
    fetch(path, { method: 'HEAD' })
      .then(res => {
        if (!res.ok || res.headers.get('content-type')?.includes('text/html')) {
          setGlbLoadError(true);
        }
      })
      .catch(() => {
        setGlbLoadError(true);
      });
  }, [activeModel?.glb_path]);

  // 6. Preload next model poster/resource during idle if multiple exist
  useEffect(() => {
    if (models.length > 1 && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => {
        const nextIndex = (activeIndex + 1) % models.length;
        const nextModel = models[nextIndex];
        if (nextModel?.poster_path) {
          const img = new Image();
          img.src = nextModel.poster_path;
        }
      });
      return () => (window as any).cancelIdleCallback(handle);
    }
  }, [activeIndex, models]);

  // Keyboard navigation for arrow key orbit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      let newTheta = theta;
      let newPhi = phi;

      if (e.key === 'ArrowLeft') newTheta = (theta - 15 + 360) % 360;
      if (e.key === 'ArrowRight') newTheta = (theta + 15) % 360;
      if (e.key === 'ArrowUp') newPhi = Math.max(30, phi - 10);
      if (e.key === 'ArrowDown') newPhi = Math.min(90, phi + 10);

      setTheta(newTheta);
      setPhi(newPhi);

      if (modelViewerRef.current) {
        modelViewerRef.current.cameraOrbit = `${newTheta}deg ${newPhi}deg 105%`;
      }
    }
  };

  if (!activeModel) return null;

  const kindLabel =
    activeModel.model_kind === 'reconstruction' || activeModel.model_kind === 'illustrative'
      ? 'نموذج تقريبي'
      : activeModel.model_kind === 'scan'
      ? 'مسح ثلاثي الأبعاد'
      : 'تصوير مساحي ثلاثي الأبعاد';

  const shouldRenderModel =
    !isPosterOnly &&
    isInteractive &&
    isVisible &&
    !glbLoadError;

  const ariaLabel = site
    ? `نموذج ثلاثي الأبعاد لمعلم ${site.name_ar}، محافظة كربلاء`
    : 'نموذج ثلاثي الأبعاد لمعلم تراثي في كربلاء';

  const posterUrl = activeModel.poster_path || '/models/home-hero-poster.webp';
  const glbUrl = activeModel.glb_path.startsWith('/') ? activeModel.glb_path : '/' + activeModel.glb_path;

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full max-w-full text-right"
      dir="rtl"
    >
      {/* Switcher if multiple models exist */}
      {models.length > 1 && (
        <div
          className="flex items-center gap-2 mb-2 flex-wrap"
          role="tablist"
          aria-label="نماذج المعالم التراثية"
        >
          {models.map((m, idx) => {
            const mSite = getSiteById(m.site_id);
            const label = mSite?.name_ar || `نموذج ${idx + 1}`;
            const isActive = idx === activeIndex;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(idx)}
                className={`text-xs px-3 py-1.5 min-h-[44px] rounded-md border font-sans transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#78350F] ${
                  isActive
                    ? 'bg-[#78350F] text-white border-[#78350F] font-semibold'
                    : 'bg-white text-stone-700 border-[#E8E2D8] hover:border-[#78350F]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Model Viewer Container with reserved aspect ratio to eliminate layout shifts */}
      <div
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className="relative w-full aspect-[4/3] max-h-[38dvh] lg:max-h-[420px] rounded-xl overflow-hidden bg-white border border-[#E8E2D8] shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#78350F]"
        style={{ touchAction: 'pan-y' }}
      >
        {shouldRenderModel ? (
          <model-viewer
            ref={modelViewerRef}
            src={glbUrl}
            poster={posterUrl}
            alt={ariaLabel}
            camera-orbit={`${theta}deg ${phi}deg 105%`}
            auto-rotate={!isPaused && isVisible && !tabHidden ? '' : null}
            rotation-per-second="15deg"
            auto-rotate-delay="3000"
            interaction-prompt="none"
            camera-controls
            disable-zoom
            disable-pan
            shadow-intensity="1"
            shadow-softness="0.8"
            draco-decoder-location="/libs/draco/"
            ktx2-decoder-location="/libs/basis/"
            loading="lazy"
            reveal="auto"
            onError={() => {
              // Gracefully fallback to poster without throwing fake monument
              setGlbLoadError(true);
            }}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              touchAction: 'pan-y',
            }}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-stone-50 overflow-hidden">
            <img
              src={posterUrl}
              alt={ariaLabel}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover"
            />
            {glbLoadError && (
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs border border-stone-200 px-3 py-1.5 rounded-md shadow-xs text-xs text-stone-700 flex items-center gap-1.5 font-sans">
                <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
                <span>النموذج قيد التوثيق والمعالجة الرقمية</span>
              </div>
            )}
          </div>
        )}

        {/* 44px Accessible Pause/Play Rotation Button */}
        {!isPosterOnly && !glbLoadError && (
          <div className="absolute bottom-3 left-3 z-10">
            <button
              type="button"
              aria-pressed={isPaused}
              aria-label={isPaused ? 'تشغيل التدوير التلقائي' : 'إيقاف التدوير التلقائي'}
              onClick={() => setIsPaused(!isPaused)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/95 hover:bg-white text-stone-700 hover:text-[#78350F] border border-[#E8E2D8] shadow-sm flex items-center justify-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#78350F]"
              title={isPaused ? 'تشغيل التدوير التلقائي' : 'إيقاف التدوير التلقائي'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current ml-0.5" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Database-Driven Metadata Strip: Taken directly from DB, no code-invented history */}
      <div className="mt-3 px-1 space-y-1.5 text-xs text-stone-600 font-sans">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {site ? (
            <button
              type="button"
              onClick={() => onSelectSite(site)}
              className="text-sm font-serif font-bold text-[#78350F] hover:text-[#9A3412] hover:underline cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#78350F] rounded"
            >
              {site.name_ar}
            </button>
          ) : (
            <span className="text-sm font-serif font-bold text-stone-900">معلم تراثي</span>
          )}

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
              {kindLabel}
            </span>
            {activeModel.is_demo && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100/90 text-amber-900 border border-amber-200">
                بيانات تجريبية
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 flex-wrap gap-x-4 gap-y-1 pt-0.5 border-t border-[#E8E2D8]/60">
          <span>جهة التوثيق: {activeModel.credit}</span>
          <span>الترخيص: {activeModel.license}</span>
        </div>
      </div>
    </div>
  );
};
