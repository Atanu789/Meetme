export function BackgroundGradientAnimation() {
  return (
    <div aria-hidden="true" className="app-background">
      <div className="app-background__mesh" />
      <div className="app-background__vortex" />
      <div className="app-background__vortex-core" />
      <div className="app-background__vortex-ring app-background__vortex-ring--one" />
      <div className="app-background__vortex-ring app-background__vortex-ring--two" />
      <div className="app-background__vortex-sweep app-background__vortex-sweep--one" />
      <div className="app-background__vortex-sweep app-background__vortex-sweep--two" />
      <div className="app-background__orb app-background__orb--one" />
      <div className="app-background__orb app-background__orb--two" />
      <div className="app-background__orb app-background__orb--three" />
      <div className="app-background__orb app-background__orb--four" />
      <div className="app-background__vignette" />
    </div>
  );
}
