'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export interface GlobeConfig {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: { lat: number; lng: number };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export interface Position {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
}

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

const defaultConfig: GlobeConfig = {
  pointSize: 2.2,
  globeColor: '#0f172a',
  showAtmosphere: true,
  atmosphereColor: '#38bdf8',
  atmosphereAltitude: 0.18,
  emissive: '#0f172a',
  emissiveIntensity: 0.12,
  shininess: 0.8,
  polygonColor: 'rgba(255,255,255,0.08)',
  ambientLight: '#38bdf8',
  directionalLeftLight: '#bae6fd',
  directionalTopLight: '#fbbf24',
  pointLight: '#ffffff',
  arcTime: 1200,
  arcLength: 0.5,
  rings: 4,
  maxRings: 8,
  initialPosition: { lat: 22.3, lng: 78.9 },
  autoRotate: true,
  autoRotateSpeed: 0.6,
};

export function World({ globeConfig, data }: WorldProps) {
  const globeRef = useRef<any>(null);
  const config = useMemo(() => ({ ...defaultConfig, ...globeConfig }), [globeConfig]);
  const [ringsData, setRingsData] = useState<Position[]>([]);

  const pointsData = useMemo(
    () =>
      data.flatMap((item) => [
        { lat: item.startLat, lng: item.startLng, color: item.color },
        { lat: item.endLat, lng: item.endLng, color: item.color },
      ]),
    [data]
  );

  const globeMaterial = useMemo(() => {
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(config.globeColor || defaultConfig.globeColor),
      emissive: new THREE.Color(config.emissive || defaultConfig.emissive),
      emissiveIntensity: config.emissiveIntensity ?? defaultConfig.emissiveIntensity,
      shininess: config.shininess ?? defaultConfig.shininess,
    });
    return material;
  }, [config.globeColor, config.emissive, config.emissiveIntensity, config.shininess]);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls?.();
    if (controls) {
      controls.autoRotate = config.autoRotate ?? true;
      controls.autoRotateSpeed = config.autoRotateSpeed ?? 0.6;
      controls.enableZoom = false;
      controls.enablePan = false;
    }

    if (config.initialPosition) {
      globeRef.current.pointOfView({
        lat: config.initialPosition.lat,
        lng: config.initialPosition.lng,
        altitude: 2.2,
      });
    }
  }, [config.autoRotate, config.autoRotateSpeed, config.initialPosition]);

  useEffect(() => {
    if (!pointsData.length) return;
    const maxRings = config.maxRings ?? defaultConfig.maxRings;
    const ringCount = Math.min(config.rings ?? defaultConfig.rings, maxRings);

    const updateRings = () => {
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      setRingsData(shuffled.slice(0, ringCount));
    };

    updateRings();
    const interval = window.setInterval(updateRings, 2000);
    return () => window.clearInterval(interval);
  }, [data, config.rings, config.maxRings, pointsData.length]);

  return (
    <div className="relative h-[420px] w-full">
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={globeMaterial}
        showAtmosphere={config.showAtmosphere}
        atmosphereColor={config.atmosphereColor}
        atmosphereAltitude={config.atmosphereAltitude}
        arcsData={data}
        arcColor={(item: Position) => item.color}
        arcAltitude={(item: Position) => item.arcAlt}
        arcDashLength={config.arcLength}
        arcDashGap={1 - (config.arcLength ?? defaultConfig.arcLength)}
        arcDashInitialGap={(item: Position) => item.order}
        arcDashAnimateTime={config.arcTime}
        pointsData={pointsData}
        pointColor={(item: { color: string }) => item.color}
        pointRadius={config.pointSize}
        pointsMerge={true}
        ringsData={ringsData}
        ringColor={(item: Position) => item.color}
        ringMaxRadius={12}
        ringPropagationSpeed={2}
        ringRepeatPeriod={(config.arcTime ?? defaultConfig.arcTime) * 1.6}
        ambientLightColor={config.ambientLight}
        directionalLeftLightColor={config.directionalLeftLight}
        directionalTopLightColor={config.directionalTopLight}
        pointLightColor={config.pointLight}
      />
    </div>
  );
}
