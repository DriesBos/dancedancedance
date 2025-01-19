'use client';

import CanvasInner from './CanvasInner';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  CameraControls,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import BlokTest from './BlokTest';
import { useEffect, useRef, useState } from 'react';

const CanvasComponent = ({ children }) => {
  // function Rig() {
  //   useFrame((state) => {
  //     state.camera.position.lerp(
  //       { x: 0, y: -state.pointer.y / 2, z: state.pointer.x / 2 },
  //       0.1
  //     );
  //     state.camera.lookAt(-1, 0, 0);
  //   });
  // }

  const [rangeValue, setRangeValue] = useState(0.5);

  function handleRangeChange(newRange) {
    setRangeValue(newRange);
    console.log('New range value from BlokTest:', newRange);
  }

  return (
    <div className="canvas">
      <Canvas camera={{ position: [0, 0, 5], fov: 25 }}>
        {/* <Rig from={-Math.PI / 2} to={Math.PI / 2.66} /> */}
        {/* <PerspectiveCamera makeDefault position={[0, 0, 2]} /> */}
        {/* <CameraControls makeDefault /> */}
        {/* <CameraControls
          makeDefault
          minAzimuthAngle={-Math.PI / 2.5}
          maxAzimuthAngle={Math.PI / 2.5}
          minPolarAngle={0.5}
          maxPolarAngle={Math.PI / 2}
        /> */}

        <CanvasInner rangeValue={rangeValue}>
          {/* <BlokTest onRangeChange={handleRangeChange} /> */}
          <p>CANVASINNER</p>
          {children}
        </CanvasInner>
      </Canvas>
    </div>
  );
};

export default CanvasComponent;
