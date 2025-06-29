import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SunLighting = ({ 
  sunPosition = [50, 50, 50],
  sunIntensity = 2,
  sunColor = '#ffffff',
  ambientIntensity = 0.3,
  timeOfDay = 12, // 0-24 hours
  enableShadows = true,
  shadowQuality = 'medium'
}) => {
  const sunRef = useRef();
  const { scene } = useThree();

  // Calculate sun position based on time of day
  const calculateSunPosition = (hour) => {
    // Convert hour to angle (0-24 hours to 0-360 degrees)
    const angle = ((hour - 6) / 12) * Math.PI; // Sunrise at 6am, sunset at 6pm
    const elevation = Math.sin(angle) * 80; // Height of sun
    const azimuth = Math.cos(angle) * 100; // Horizontal position
    
    return [azimuth, Math.max(elevation, -20), 50];
  };

  // Calculate sun color based on time of day
  const calculateSunColor = (hour) => {
    if (hour < 6 || hour > 18) {
      // Night time - cool blue
      return '#1a237e';
    } else if (hour < 8 || hour > 16) {
      // Golden hour - warm orange
      return '#ff8f00';
    } else {
      // Day time - bright white
      return '#ffffff';
    }
  };

  // Calculate sun intensity based on time of day
  const calculateSunIntensity = (hour) => {
    if (hour < 6 || hour > 18) {
      return 0.1; // Very dim at night
    } else if (hour < 8 || hour > 16) {
      return 1.5; // Moderate during golden hour
    } else {
      return 2.5; // Bright during day
    }
  };

  useEffect(() => {
    if (sunRef.current) {
      // Configure shadow properties based on quality
      const shadowMapSizes = {
        low: 1024,
        medium: 2048,
        high: 4096,
        ultra: 8192
      };

      sunRef.current.shadow.mapSize.width = shadowMapSizes[shadowQuality] || 2048;
      sunRef.current.shadow.mapSize.height = shadowMapSizes[shadowQuality] || 2048;
      sunRef.current.shadow.camera.near = 0.5;
      sunRef.current.shadow.camera.far = 500;
      sunRef.current.shadow.camera.left = -100;
      sunRef.current.shadow.camera.right = 100;
      sunRef.current.shadow.camera.top = 100;
      sunRef.current.shadow.camera.bottom = -100;
      sunRef.current.shadow.bias = -0.0001;
      sunRef.current.shadow.normalBias = 0.02;
    }
  }, [shadowQuality]);

  useFrame((state) => {
    if (sunRef.current) {
      // Dynamic sun position based on time
      const dynamicPosition = calculateSunPosition(timeOfDay);
      sunRef.current.position.set(...dynamicPosition);
      
      // Update sun color and intensity
      const dynamicColor = calculateSunColor(timeOfDay);
      const dynamicIntensity = calculateSunIntensity(timeOfDay);
      
      sunRef.current.color.setHex(dynamicColor.replace('#', '0x'));
      sunRef.current.intensity = dynamicIntensity * sunIntensity;

      // Add subtle movement for more dynamic lighting
      const time = state.clock.elapsedTime * 0.1;
      sunRef.current.position.x += Math.sin(time) * 2;
      sunRef.current.position.z += Math.cos(time) * 2;
    }
  });

  return (
    <>
      {/* Main Sun Light */}
      <directionalLight
        ref={sunRef}
        position={calculateSunPosition(timeOfDay)}
        intensity={calculateSunIntensity(timeOfDay) * sunIntensity}
        color={calculateSunColor(timeOfDay)}
        castShadow={enableShadows}
      />

      {/* Ambient Light for overall scene illumination */}
      <ambientLight 
        intensity={ambientIntensity} 
        color="#404040" 
      />

      {/* Hemisphere Light for sky/ground color variation */}
      <hemisphereLight
        skyColor="#87CEEB"
        groundColor="#8B4513"
        intensity={0.6}
      />

      {/* Fill Light for softer shadows */}
      <directionalLight
        position={[-30, 20, -30]}
        intensity={0.3}
        color="#ffffff"
      />

      {/* Rim Light for object definition */}
      <directionalLight
        position={[0, 10, -50]}
        intensity={0.2}
        color="#ffffff"
      />
    </>
  );
};

export default SunLighting;