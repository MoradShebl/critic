import React from 'react';
import { Sky } from '@react-three/drei';

const SkyEnvironment = ({ 
  timeOfDay = 12,
  sunPosition = [1, 0.2, 0],
  turbidity = 10,
  rayleigh = 3
}) => {
  // Calculate sky parameters based on time of day
  const calculateSkyParams = (hour) => {
    if (hour < 6 || hour > 18) {
      // Night
      return {
        turbidity: 20,
        rayleigh: 0.5,
        mieCoefficient: 0.1,
        mieDirectionalG: 0.8,
        elevation: -10,
        azimuth: 180
      };
    } else if (hour < 8 || hour > 16) {
      // Golden hour
      return {
        turbidity: 15,
        rayleigh: 2,
        mieCoefficient: 0.05,
        mieDirectionalG: 0.7,
        elevation: 2,
        azimuth: hour < 8 ? 90 : 270
      };
    } else {
      // Day
      return {
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 60,
        azimuth: 180
      };
    }
  };

  const skyParams = calculateSkyParams(timeOfDay);

  return (
    <Sky
      distance={450000}
      sunPosition={sunPosition}
      inclination={0}
      azimuth={0.25}
      turbidity={skyParams.turbidity}
      rayleigh={skyParams.rayleigh}
      mieCoefficient={skyParams.mieCoefficient}
      mieDirectionalG={skyParams.mieDirectionalG}
    />
  );
};

export default SkyEnvironment;