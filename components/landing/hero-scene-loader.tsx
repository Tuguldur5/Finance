"use client";

import dynamic from "next/dynamic";
import * as React from "react";

function StaticSceneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex size-36 items-center justify-center rounded-full border border-blue-600/50 bg-secondary sm:size-40 dark:border-blue-500/40 dark:bg-[#0a0a0a]">
        <div className="absolute inset-5 rounded-full border border-border dark:border-white/10" />
        <span className="text-2xl font-semibold tracking-tight text-muted-foreground">
          ₮
        </span>
      </div>
    </div>
  );
}

const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => <StaticSceneFallback />,
});

type SceneErrorBoundaryProps = {
  fallback: React.ReactNode;
  children: React.ReactNode;
};

type SceneErrorBoundaryState = {
  failed: boolean;
};

/** Catches WebGL/context creation failures and keeps the static fallback. */
class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

export function HeroSceneLoader() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [webglAvailable, setWebglAvailable] = React.useState<boolean | null>(
    null,
  );
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [inView, setInView] = React.useState(true);
  const [tabHidden, setTabHidden] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setWebglAvailable(supportsWebGL());
    setTabHidden(document.visibilityState === "hidden");

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);

    const onMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    motionQuery.addEventListener("change", onMotionChange);
    return () => motionQuery.removeEventListener("change", onMotionChange);
  }, []);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const onVisibilityChange = () => {
      setTabHidden(document.visibilityState === "hidden");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const renderScene =
    mounted && webglAvailable === true && !reducedMotion;
  const active = renderScene && inView && !tabHidden;

  return (
    <div ref={containerRef} className="h-full w-full" aria-hidden="true">
      {renderScene ? (
        <SceneErrorBoundary fallback={<StaticSceneFallback />}>
          <HeroScene active={active} />
        </SceneErrorBoundary>
      ) : (
        <StaticSceneFallback />
      )}
    </div>
  );
}
