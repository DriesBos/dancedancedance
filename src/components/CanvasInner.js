'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { CameraControls, Html } from '@react-three/drei';
import { IconArrowLongUp } from '@/components/Icons/IconArrowLongUp';

const CanvasComponent = ({ children, rangeValue }) => {
  const boxOne = useRef();
  const htmlObject = useRef();

  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    // boxOne.current.rotation.y += delta;
    // htmlObject.current.rotation.y += delta;
    // console.log(htmlObject.current);
    // console.log(boxOne.current);
  });

  return (
    <>
      <Html
        occlude
        distanceFactor={1}
        scale={1}
        ref={htmlObject}
        position={[0, 0, rangeValue * 2]}
        transform
        className="html"
      >
        <p>HTML</p>
        {children}
      </Html>

      {/* <mesh
        onClick={(event) => setActive(!active)}
        ref={boxOne}
        rotation-y={3}
        position-x={0}
        scale={active ? 1.5 : 1}
        onPointerOver={(event) => setHover(true)}
        onPointerOut={(event) => setHover(false)}
      >
        <boxGeometry />
        <meshBasicMaterial color={hovered ? 'orange' : 'red'} wireframe />
      </mesh> */}
    </>
  );
};

export default CanvasComponent;
