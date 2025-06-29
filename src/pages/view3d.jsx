import {
  useState,
  useEffect,
  useRef,
  Suspense,
  useMemo,
  useCallback,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { createPortal } from "react-dom";

// Components
import Header from "../components/3dView/Header";
import FileUpload from "../components/3dView/FileUpload";
import SideMenu from "../components/3dView/SideMenu";

// Styles
import "../styles/App.css";

// Memoized loader instances for better performance
const loaderInstances = {
  fbx: new FBXLoader(),
  obj: new OBJLoader(),
  gltf: new GLTFLoader(),
};

// Configure loaders once
loaderInstances.fbx.setResourcePath("./");

// Camera controller for orbit and walk mode with smooth animation
function CameraController({ object, resetFlag, firstPerson, animateOnLoad }) {
  const { camera, controls } = useThree();
  const animationRef = useRef();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);

  useEffect(() => {
    if (!object || firstPerson) return;

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const baseDistance = Math.max(2, maxDim * 1.7);
    const height = Math.max(baseDistance * 0.45, size.y * 0.7);

    if (animateOnLoad && !isAnimating.current) {
      isAnimating.current = true;

      // Enhanced animation with multiple phases
      const totalDuration = 6000; // Increased total duration
      const phase1Duration = 3000; // Orbit phase
      const phase2Duration = 1500; // Zoom in phase
      const phase3Duration = 1500; // Move to top view phase
      
      const startTime = performance.now();
      const radiusStart = baseDistance * 3.5; // Start even farther
      const radiusMiddle = baseDistance * 0.8; // Middle zoom position
      const radiusEnd = baseDistance * 1.2; // Final top view distance
      
      // Initial positions
      const orbitY = center.y + height;
      const topViewY = center.y + maxDim * 2; // High above for top view
      const lookAt = center.clone();
      
      targetLookAt.current.copy(lookAt);

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const totalProgress = Math.min(elapsed / totalDuration, 1);
        
        let camX, camY, camZ;
        
        if (elapsed < phase1Duration) {
          // Phase 1: Orbital movement with zoom in
          const t1 = elapsed / phase1Duration;
          const ease1 = easeInOutCubic(t1);
          
          const angle = ease1 * Math.PI * 2.5; // More than full rotation
          const radius = radiusStart + (radiusMiddle - radiusStart) * ease1;
          const currentY = orbitY + Math.sin(t1 * Math.PI * 2) * (height * 0.2); // Slight vertical oscillation
          
          camX = center.x + radius * Math.cos(angle);
          camZ = center.z + radius * Math.sin(angle);
          camY = currentY;
          
        } else if (elapsed < phase1Duration + phase2Duration) {
          // Phase 2: Continue orbit while getting closer and slightly higher
          const t2 = (elapsed - phase1Duration) / phase2Duration;
          const ease2 = easeInOutQuart(t2);
          
          const angle = 2.5 * Math.PI + ease2 * Math.PI * 0.8; // Continue rotating
          const radius = radiusMiddle + (radiusEnd - radiusMiddle) * ease2;
          const currentY = orbitY + (topViewY * 0.3 - orbitY) * ease2; // Start moving up
          
          camX = center.x + radius * Math.cos(angle);
          camZ = center.z + radius * Math.sin(angle);
          camY = currentY;
          
        } else {
          // Phase 3: Transition to top view
          const t3 = (elapsed - phase1Duration - phase2Duration) / phase3Duration;
          const ease3 = easeOutQuart(t3);
          
          // Smoothly transition to directly above
          const prevAngle = 2.5 * Math.PI + 0.8 * Math.PI;
          const prevX = center.x + radiusEnd * Math.cos(prevAngle);
          const prevZ = center.z + radiusEnd * Math.sin(prevAngle);
          const prevY = orbitY + (topViewY * 0.3 - orbitY);
          
          camX = prevX + (center.x - prevX) * ease3;
          camZ = prevZ + (center.z - prevZ) * ease3;
          camY = prevY + (topViewY - prevY) * ease3;
        }

        targetPosition.current.set(camX, camY, camZ);
        camera.position.copy(targetPosition.current);
        camera.lookAt(targetLookAt.current);

        if (controls) {
          controls.target.copy(targetLookAt.current);
          controls.update();
        }

        if (totalProgress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          isAnimating.current = false;
        }
      };

      animate();

      if (controls) controls.enabled = false;
      const enableControlsTimeout = setTimeout(() => {
        if (controls) controls.enabled = true;
      }, totalDuration + 100);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        clearTimeout(enableControlsTimeout);
        if (controls) controls.enabled = true;
      };
      
    } else if (!animateOnLoad) {
      // Static positioning when not animating
      const angle = Math.PI / 5;
      const newPosition = center
        .clone()
        .add(
          new THREE.Vector3(
            baseDistance * Math.cos(angle),
            height,
            baseDistance * Math.sin(angle)
          )
        );
      targetPosition.current.copy(newPosition);
      targetLookAt.current.copy(center);
      camera.position.copy(targetPosition.current);
      camera.lookAt(targetLookAt.current);
      if (controls) {
        controls.target.copy(targetLookAt.current);
        controls.update();
      }
    }

    camera.near = Math.max(0.01, maxDim / 1000);
    camera.far = Math.max(1000, maxDim * 1000);
    camera.updateProjectionMatrix();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (controls) controls.enabled = true;
    };
  }, [object, camera, controls, resetFlag, firstPerson, animateOnLoad]);

  return null;
}

// Enhanced easing functions for smoother animations
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}
// Walk mode controller with mouse wheel speed adjustment
function FirstPersonController({ enabled }) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});
  const [walkSpeed, setWalkSpeed] = useState(2);
  const [runSpeed, setRunSpeed] = useState(4);
  const state = useRef({
    pitch: 0,
    yaw: 0,
    isPointerLocked: false,
    speedBoost: false,
  });

  useEffect(() => {
    if (!enabled) return;
    const handleWheel = (e) => {
      // Allow walkSpeed: 0.0001 - 10000, runSpeed: 0.0002 - 20000
      setWalkSpeed((prev) =>
        Math.max(0.0001, Math.min(10000, prev - e.deltaY * 0.005))
      );
      setRunSpeed((prev) =>
        Math.max(0.0002, Math.min(20000, prev - e.deltaY * 0.01))
      );
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = gl.domElement;
    const handlePointerLockChange = () => {
      state.current.isPointerLocked = document.pointerLockElement === canvas;
      if (state.current.isPointerLocked)
        document.addEventListener("mousemove", handleMouseMove);
      else document.removeEventListener("mousemove", handleMouseMove);
    };
    const handleMouseMove = (event) => {
      if (!state.current.isPointerLocked) return;
      state.current.yaw -= event.movementX * 0.002;
      state.current.pitch -= event.movementY * 0.002;
      state.current.pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, state.current.pitch)
      );
      camera.rotation.set(state.current.pitch, state.current.yaw, 0, "YXZ");
    };
    const handleClick = () =>
      canvas.requestPointerLock && canvas.requestPointerLock();
    canvas.addEventListener("click", handleClick);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    return () => {
      canvas.removeEventListener("click", handleClick);
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [enabled, camera, gl]);

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
      if (e.code === "Space") state.current.speedBoost = true;
    };
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
      if (e.code === "Space") state.current.speedBoost = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) return;
    direction.current.set(0, 0, 0);
    if (keys.current.KeyW || keys.current.ArrowUp) direction.current.z -= 1;
    if (keys.current.KeyS || keys.current.ArrowDown) direction.current.z += 1;
    if (keys.current.KeyA || keys.current.ArrowLeft) direction.current.x -= 1;
    if (keys.current.KeyD || keys.current.ArrowRight) direction.current.x += 1;
    if (keys.current.KeyQ) direction.current.y -= 1;
    if (keys.current.KeyE) direction.current.y += 1;
    if (direction.current.length() > 0) {
      direction.current.normalize();
      let speed = state.current.speedBoost
        ? runSpeed * 2
        : keys.current.ShiftLeft || keys.current.ShiftRight
        ? runSpeed
        : walkSpeed;
      camera.position.add(
        direction.current
          .clone()
          .applyEuler(camera.rotation)
          .multiplyScalar(speed * delta)
      );
    }
  });
  return null;
}

// Enhanced model loader with memoization and better performance
function ModelViewer({
  file,
  wireframe,
  setModelInfo,
  setAnimations,
  animationIndex,
  setLoadingProgress,
  onModelLoaded,
  shadowQuality,
  enableShaders,
  showGround,
  groundOpacity,
  cameraPoints = [],
  enableLightBox,
}) {
  const [model, setModel] = useState(null);
  const [clock] = useState(() => new THREE.Clock());
  const [modelBounds, setModelBounds] = useState(null);
  const requestRef = useRef();
  const loadingCache = useRef(new Map());
  const [modelLights, setModelLights] = useState([]); // <-- Add state for lights

  // Memoized material enhancement function
  const applyEnhancedShadows = useCallback(
    (obj) => {
      obj.traverse((child) => {
        if (child.isMesh && child.material) {
          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;

          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          materials.forEach((mat) => {
            mat.wireframe = wireframe;

            // Enhanced shadow properties
            mat.shadowSide = THREE.DoubleSide;

            // --- Preserve original opacity for transparent materials (e.g., glass) ---
            if (
              mat.transparent &&
              typeof mat.opacity === "number" &&
              mat.opacity < 1
            ) {
              mat.opacity = mat.opacity; // keep original
              mat.transparent = true;
              mat.depthWrite = false; // helps with correct blending for glass
              mat.alphaTest = 0.01;
              // Optionally, you can set mat.blending = THREE.NormalBlending;
            }

            // Improve material properties for better shadows
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
              mat.roughness = mat.roughness !== undefined ? mat.roughness : 0.7;
              mat.metalness = mat.metalness !== undefined ? mat.metalness : 0.1;

              // Enhance shadow reception
              if (enableShaders) {
                mat.envMapIntensity = 0.8;
              }
            } else if (mat.isMeshLambertMaterial || mat.isMeshPhongMaterial) {
              // Convert basic materials to standard for better shadows
              const standardMat = new THREE.MeshStandardMaterial({
                color: mat.color,
                map: mat.map,
                normalMap: mat.normalMap,
                roughness: 0.7,
                metalness: 0.1,
                wireframe: wireframe,
                shadowSide: THREE.DoubleSide,
                transparent: mat.transparent,
                opacity: mat.opacity,
                depthWrite: mat.depthWrite,
                alphaTest: mat.alphaTest,
              });
              child.material = standardMat;
            }

            mat.needsUpdate = true;
          });

          // Optimize geometry for shadows
          if (child.geometry) {
            if (!child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }
            child.geometry.computeBoundingSphere();
            child.geometry.computeBoundingBox();
          }
        }
      });
    },
    [wireframe, enableShaders]
  );

  // Memoized model info extraction
  const extractInfo = useCallback((obj) => {
    let meshCount = 0,
      vertexCount = 0,
      triangleCount = 0;
    obj.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        if (child.geometry) {
          vertexCount += child.geometry.attributes.position?.count || 0;
          triangleCount += child.geometry.index
            ? child.geometry.index.count / 3
            : (child.geometry.attributes.position?.count || 0) / 3;
        }
      }
    });
    return { meshCount, vertexCount, triangleCount };
  }, []);

  // Memoized bounds calculation
  const calculateModelBounds = useCallback((obj) => {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { box, size, center };
  }, []);

  // Optimized loading function with caching
  const loadModelAsync = useCallback(async () => {
    if (!file) return;

    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

    // Check cache first
    if (loadingCache.current.has(fileKey)) {
      const cachedModel = loadingCache.current.get(fileKey);
      setModel(cachedModel.model);
      setModelBounds(cachedModel.bounds);
      setModelInfo(cachedModel.info);
      setAnimations(cachedModel.animations);
      setModelLights(cachedModel.lights || []); // <-- Restore cached lights
      setLoadingProgress(100);
      if (onModelLoaded) onModelLoaded();
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    setLoadingProgress(10);

    try {
      let loadedModel = null;

      if (ext === "fbx") {
        const arrayBuffer = await file.arrayBuffer();
        setLoadingProgress(30);
        loadedModel = loaderInstances.fbx.parseAsync
          ? await loaderInstances.fbx.parseAsync(arrayBuffer, "")
          : loaderInstances.fbx.parse(arrayBuffer, "");
      } else if (ext === "obj") {
        const text = await file.text();
        setLoadingProgress(30);
        loadedModel = loaderInstances.obj.parse(text);
      } else if (ext === "gltf" || ext === "glb") {
        setLoadingProgress(20);
        loaderInstances.gltf.manager.onProgress = (_, loaded, total) => {
          const progress = Math.round((loaded / total) * 60) + 20; // 20-80%
          setLoadingProgress(progress);
        };

        loadedModel = await new Promise((resolve, reject) => {
          loaderInstances.gltf.load(
            URL.createObjectURL(file),
            (gltf) => resolve(gltf.scene),
            undefined,
            () => reject(new Error("Failed to load GLTF/GLB file"))
          );
        });
      } else {
        throw new Error("Unsupported file format");
      }

      if (loadedModel) {
        setLoadingProgress(85);

        // homely enhancements
        applyEnhancedShadows(loadedModel);

        setLoadingProgress(95);

        const bounds = calculateModelBounds(loadedModel);
        const info = extractInfo(loadedModel);
        const animations = loadedModel.animations || [];

        // --- Collect lights from the model ---
        const lights = [];
        loadedModel.traverse((child) => {
          if (child.isLight) {
            lights.push(child);
          }
        });
        setModelLights(lights);

        // Cache the processed model and lights
        loadingCache.current.set(fileKey, {
          model: loadedModel,
          bounds,
          info,
          animations,
          lights,
        });

        // Limit cache size to prevent memory issues
        if (loadingCache.current.size > 5) {
          const firstKey = loadingCache.current.keys().next().value;
          loadingCache.current.delete(firstKey);
        }

        setModel(loadedModel);
        setModelBounds(bounds);
        setModelInfo(info);
        setAnimations(animations);
        setLoadingProgress(100);

        // Trigger camera animation
        if (onModelLoaded) {
          onModelLoaded();
        }
      }
    } catch (error) {
      setModelInfo({ error: error.message || "Failed to load model." });
      setLoadingProgress(0);
    }
  }, [
    file,
    applyEnhancedShadows,
    calculateModelBounds,
    extractInfo,
    setModelInfo,
    setAnimations,
    setLoadingProgress,
    onModelLoaded,
  ]);

  useEffect(() => {
    let isMounted = true;
    setModel(null);
    setModelInfo({});
    setAnimations([]);
    setLoadingProgress(0);
    setModelBounds(null);

    if (file && isMounted) {
      loadModelAsync();
    }

    return () => {
      isMounted = false;
    };
  }, [file, loadModelAsync]);

  // Animation handling with memoization
  useEffect(() => {
    if (!model || !model.animations || model.animations.length === 0) return;

    const mixer = new THREE.AnimationMixer(model);
    if (model.animations[animationIndex]) {
      mixer.stopAllAction();
      const action = mixer.clipAction(model.animations[animationIndex]);
      action.play();
    }

    function animate() {
      mixer.update(clock.getDelta());
      requestRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      mixer.stopAllAction();
    };
  }, [model, animationIndex, clock]);

  // Memoized shadow plane size calculation
  const shadowPlaneConfig = useMemo(() => {
    if (!modelBounds) return { size: 200, y: -0.01 };

    return {
      size: Math.max(modelBounds.size.x, modelBounds.size.z) * 8, // was *4
      y: modelBounds.box.min.y - 0.01,
    };
  }, [modelBounds]);

  // Light Box System - Creates a bounding box of lights around the model
  const lightBoxLights = useMemo(() => {
    if (!enableLightBox || !modelBounds) return [];

    const { center, size } = modelBounds;
    const lights = [];
    
    // Make the light box much larger
    const boxSize = Math.max(size.x, size.y, size.z) * 3;
    const lightIntensity = 0.8;
    const lightDistance = boxSize * 1.5;

    // Create 11 strategic point lights around the model
    const positions = [
      // Top lights
      [center.x, center.y + boxSize, center.z], // Top center
      [center.x + boxSize, center.y + boxSize, center.z + boxSize], // Top front right
      [center.x - boxSize, center.y + boxSize, center.z + boxSize], // Top front left
      [center.x + boxSize, center.y + boxSize, center.z - boxSize], // Top back right
      [center.x - boxSize, center.y + boxSize, center.z - boxSize], // Top back left
      
      // Side lights
      [center.x + boxSize, center.y, center.z], // Right
      [center.x - boxSize, center.y, center.z], // Left
      [center.x, center.y, center.z + boxSize], // Front
      [center.x, center.y, center.z - boxSize], // Back
      
      // Bottom lights
      [center.x, center.y - boxSize * 0.5, center.z], // Bottom center
      [center.x, center.y + boxSize * 0.3, center.z], // Mid level
    ];

    positions.forEach((pos, index) => {
      lights.push(
        <pointLight
          key={`lightbox-${index}`}
          position={pos}
          intensity={lightIntensity}
          distance={lightDistance}
          decay={1}
          color="#ffffff"
          castShadow={false} // Disable shadows for performance
        />
      );
    });

    return lights;
  }, [enableLightBox, modelBounds]);

  if (!model) {
    return (
      <Html center>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "#fff",
            fontSize: 20,
            padding: 32,
            background: "#111",
            borderRadius: 16,
            boxShadow: "0 4px 32px 0 #000",
            minWidth: 260,
            minHeight: 180,
            border: "1.5px solid #222",
            letterSpacing: 0.2,
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            style={{ opacity: 0.92, animation: "spin 1.2s linear infinite" }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#fff"
              strokeWidth="2.2"
              fill="none"
            />
            <path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2.2" fill="none" />
          </svg>
          <div
            style={{
              marginTop: 18,
              marginBottom: 12,
              fontWeight: 600,
              fontSize: 22,
            }}
          >
            Loading model...
          </div>
          <div
            style={{
              width: 200,
              height: 10,
              background: "#222",
              borderRadius: 5,
              overflow: "hidden",
              marginBottom: 8,
              boxShadow: "0 1px 8px 0 #000a",
            }}
          >
            <div
              style={{
                width: `${Math.max(5, loadingProgress || 0)}%`,
                height: "100%",
                background: "linear-gradient(90deg,#fff,#222 80%)",
                borderRadius: 5,
                transition: "width 0.2s",
                boxShadow: "0 0 8px #222",
              }}
            />
          </div>
          <div
            style={{ fontSize: 16, color: "#fff", opacity: 0.85, marginTop: 2 }}
          >
            {loadingProgress ? `${loadingProgress}%` : "Starting..."}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 13,
              color: "#aaa",
              opacity: 0.7,
              letterSpacing: 0.1,
              textAlign: "center",
            }}
          >
            Please wait while your 3D model is being processed.
            <br />
            Large files may take a few moments.
          </div>
          <style>{`@keyframes spin {0% { transform: rotate(0deg);}100% { transform: rotate(360deg);}}`}</style>
        </div>
      </Html>
    );
  }

  return (
    <>
      <primitive object={model} />
      {/* Render imported lights as primitives */}
      {modelLights.map((light, idx) => (
        <primitive object={light} key={light.uuid || idx} />
      ))}
      
      {/* Light Box System */}
      {lightBoxLights}
      
      {/* Enhanced shadow catcher plane */}
      {showGround && (
        <>
          <mesh
            receiveShadow
            position={[0, shadowPlaneConfig.y, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry
              args={[shadowPlaneConfig.size, shadowPlaneConfig.size]}
            />
            <shadowMaterial opacity={0.6} transparent={true} color="#000000" />
          </mesh>

          {/* Reflective ground plane */}
          <mesh
            receiveShadow
            position={[0, shadowPlaneConfig.y - 0.001, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry
              args={[shadowPlaneConfig.size, shadowPlaneConfig.size]}
            />
            <meshStandardMaterial
              transparent={true}
              opacity={groundOpacity}
              color="#ffffff"
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
        </>
      )}

      {/* Spheres for saved camera points */}
      {cameraPoints.map((pt, idx) => (
        <mesh
          key={pt.id}
          position={[pt.position.x, pt.position.y, pt.position.z]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[0.08, 24, 24]} />
          <meshStandardMaterial color="#ffb300" emissive="#ffb300" emissiveIntensity={0.7} />
        </mesh>
      ))}

      <CameraController
        object={model}
        resetFlag={animationIndex}
        firstPerson={window.__firstPersonActive}
        animateOnLoad={window.__animateCamera}
      />
    </>
  );
}

// Virtual Tour System
function VirtualTour({ cameraPoints, isPlaying, speed, onComplete }) {
  const { camera, controls } = useThree();
  const tourRef = useRef({
    startTime: 0,
    currentSegment: 0,
    isActive: false,
  });

  useFrame(() => {
    if (!isPlaying || cameraPoints.length < 2) return;

    if (!tourRef.current.isActive) {
      tourRef.current.isActive = true;
      tourRef.current.startTime = performance.now();
      tourRef.current.currentSegment = 0;
      if (controls) controls.enabled = false;
    }

    const elapsed = (performance.now() - tourRef.current.startTime) * speed;
    const segmentDuration = 3000; // 3 seconds per segment
    const totalSegments = cameraPoints.length - 1;
    const currentSegmentIndex = Math.floor(elapsed / segmentDuration);

    if (currentSegmentIndex >= totalSegments) {
      // Tour complete
      tourRef.current.isActive = false;
      if (controls) controls.enabled = true;
      onComplete();
      return;
    }

    const segmentProgress = (elapsed % segmentDuration) / segmentDuration;
    const easeProgress = easeInOutCubic(segmentProgress);

    const startPoint = cameraPoints[currentSegmentIndex];
    const endPoint = cameraPoints[currentSegmentIndex + 1];

    // Create smooth bezier curve between points
    const midPoint = startPoint.position.clone().lerp(endPoint.position, 0.5);
    midPoint.y += Math.max(2, startPoint.position.distanceTo(endPoint.position) * 0.3);

    // Quadratic bezier interpolation
    const t = easeProgress;
    const oneMinusT = 1 - t;
    const position = startPoint.position.clone()
      .multiplyScalar(oneMinusT * oneMinusT)
      .add(midPoint.clone().multiplyScalar(2 * oneMinusT * t))
      .add(endPoint.position.clone().multiplyScalar(t * t));

    camera.position.copy(position);
    
    // Smooth target interpolation
    const target = startPoint.target.clone().lerp(endPoint.target, easeProgress);
    camera.lookAt(target);
    
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
  });

  useEffect(() => {
    if (!isPlaying) {
      tourRef.current.isActive = false;
      if (controls) controls.enabled = true;
    }
  }, [isPlaying, controls]);

  return null;
}

function View3d() {
  const [file, setFile] = useState(null);
  const [wireframe, setWireframe] = useState(false);
  const [bgColor, setBgColor] = useState("sky");
  const [modelInfo, setModelInfo] = useState({});
  const [animations, setAnimations] = useState([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [lightIntensity, setLightIntensity] = useState(1.2);
  const [lightColor, setLightColor] = useState("#ffffff");
  const [firstPerson, setFirstPerson] = useState(false);
  const [resetCameraFlag, setResetCameraFlag] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [ambientIntensity, setAmbientIntensity] = useState(0.4);
  const [dirLight2Color, setDirLight2Color] = useState("#ffffff");
  const [dirLight2Pos, setDirLight2Pos] = useState([-10, 10, -5]);

  // New state variables for enhanced controls
  const [quality, setQuality] = useState("high");
  const [enableShaders, setEnableShaders] = useState(true);
  const [enableEffects, setEnableEffects] = useState(false);
  const [showGround, setShowGround] = useState(true);
  const [groundOpacity, setGroundOpacity] = useState(0.3);
  const [shadowQuality, setShadowQuality] = useState("high");
  const [antialiasing, setAntialiasing] = useState(true);
  const [animateCamera, setAnimateCamera] = useState(false);
  const [is2D, setIs2D] = useState(false);
  const [enableLightBox, setEnableLightBox] = useState(false);

  // Camera points state
  const [cameraPoints, setCameraPoints] = useState([]);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [newPointName, setNewPointName] = useState("");
  const [cameraToGo, setCameraToGo] = useState(null);
  const [showPointsManager, setShowPointsManager] = useState(false);

  // Virtual Tour state
  const [tourPlaying, setTourPlaying] = useState(false);
  const [tourSpeed, setTourSpeed] = useState(1);

  // Ref to access camera in Canvas
  const cameraRef = useRef();

  // Save camera position handler
  const handleSaveCameraPoint = useCallback(() => {
    setShowSavePopup(true);
    setNewPointName("");
  }, []);

  // Actually save the camera point
  const handleConfirmSavePoint = useCallback(() => {
    if (!cameraRef.current || !newPointName.trim()) return;
    const cam = cameraRef.current;
    const controls = cam.controls;
    setCameraPoints((prev) => [
      ...prev,
      {
        name: newPointName.trim(),
        position: cam.position.clone(),
        target: controls ? controls.target.clone() : new THREE.Vector3(0, 0, 0),
        id: Date.now(),
      },
    ]);
    setShowSavePopup(false);
    setNewPointName("");
  }, [newPointName]);

  // Remove camera point
  const handleRemovePoint = useCallback((pointId) => {
    setCameraPoints(prev => prev.filter(pt => pt.id !== pointId));
  }, []);

  // Animate camera to a saved point
  const handleGoToPoint = useCallback((pt) => {
    setCameraToGo({
      ...pt,
      // Add a random animation offset to avoid identical start/end
      animSeed: Math.random(),
    });
  }, []);

  // Camera animation effect for going to point (improved)
  useEffect(() => {
    if (!cameraToGo || !cameraRef.current) return;
    const cam = cameraRef.current;
    const controls = cam.controls;
    const start = {
      pos: cam.position.clone(),
      target: controls ? controls.target.clone() : new THREE.Vector3(0, 0, 0),
    };
    const end = {
      pos: cameraToGo.position.clone(),
      target: cameraToGo.target.clone(),
    };
    // Animation: ease in, arc, ease out
    const duration = 1600;
    const startTime = performance.now();
    // Compute arc control point for camera (midpoint above line)
    const mid = start.pos.clone().lerp(end.pos, 0.5);
    const up = new THREE.Vector3(0, 1, 0);
    const arcHeight = start.pos.distanceTo(end.pos) * 0.25 + 0.5;
    mid.addScaledVector(up, arcHeight);

    function animate() {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      // Smoothstep for ease in/out
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      // Quadratic bezier for arc
      function bezier(a, b, c, t) {
        const ab = a.clone().lerp(b, t);
        const bc = b.clone().lerp(c, t);
        return ab.lerp(bc, t);
      }
      const camPos = bezier(start.pos, mid, end.pos, ease);
      cam.position.copy(camPos);
      if (controls) {
        // Target moves linearly for smooth look
        controls.target.lerpVectors(start.target, end.target, ease);
        controls.update();
      }
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setCameraToGo(null);
      }
    }
    animate();
    // eslint-disable-next-line
  }, [cameraToGo]);

  // Virtual Tour handlers
  const handleStartTour = useCallback(() => {
    if (cameraPoints.length < 2) return;
    setTourPlaying(true);
  }, [cameraPoints.length]);

  const handleStopTour = useCallback(() => {
    setTourPlaying(false);
  }, []);

  const handleTourComplete = useCallback(() => {
    setTourPlaying(false);
  }, []);

  // Attach camera ref in Canvas
  function CameraRefAttacher() {
    const { camera, controls } = useThree();
    useEffect(() => {
      cameraRef.current = camera;
      cameraRef.current.controls = controls;
    }, [camera, controls]);
    return null;
  }

  // Track loading progress globally
  useEffect(() => {
    window.loadingProgress = loadingProgress;
    return () => {
      window.loadingProgress = 0;
    };
  }, [loadingProgress]);

  // Track first person mode globally
  useEffect(() => {
    window.__firstPersonActive = firstPerson;
  }, [firstPerson]);

  // Track camera animation flag globally
  useEffect(() => {
    window.__animateCamera = animateCamera;
  }, [animateCamera]);

  // Memoized screenshot handler
  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Save original size and style
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const originalStyle = {
      width: canvas.style.width,
      height: canvas.style.height,
    };

    // Set higher resolution for screenshot (e.g., 2x)
    const scale = 1;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.width = originalWidth * scale;
    canvas.height = originalHeight * scale;

    // Force re-render by dispatching a resize event
    window.dispatchEvent(new Event("resize"));

    setTimeout(() => {
      try {
        const url = canvas.toDataURL("image/png", 1.0);
        const a = document.createElement("a");
        a.href = url;
        a.download = `model-screenshot-${new Date()
          .toISOString()
          .slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        alert("Screenshot failed. Try again.");
      } finally {
        // Restore original size and style
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        canvas.style.width = originalStyle.width;
        canvas.style.height = originalStyle.height;
        window.dispatchEvent(new Event("resize"));
      }
    }, 200); // Wait for re-render
  }, []);

  const handleResetCamera = useCallback(
    () => setResetCameraFlag((f) => !f),
    []
  );

  const handleToggleFirstPerson = useCallback(
    () => setFirstPerson((f) => !f),
    []
  );

  const handleSaveProject = useCallback(() => {
    if (!file) return;
    const project = {
      id: Date.now(),
      name: file.name.split(".")[0],
      file: file,
      settings: {
        wireframe,
        bgColor,
        lightIntensity,
        lightColor,
        animationIndex,
        quality,
        enableShaders,
        enableEffects,
        showGround,
        groundOpacity,
        shadowQuality,
        antialiasing,
        ambientIntensity,
        dirLight2Color,
        dirLight2Pos,
        enableLightBox,
      },
      points: cameraPoints, // <-- Save camera points with project
      savedAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, project]);
    setCurrentProject(project);
  }, [
    file,
    wireframe,
    bgColor,
    lightIntensity,
    lightColor,
    animationIndex,
    quality,
    enableShaders,
    enableEffects,
    showGround,
    groundOpacity,
    shadowQuality,
    antialiasing,
    ambientIntensity,
    dirLight2Color,
    dirLight2Pos,
    enableLightBox,
    cameraPoints, // <-- Add cameraPoints as dependency
  ]);

  const handleLoadProject = useCallback((project) => {
    setFile(project.file);
    const settings = project.settings;
    setWireframe(settings.wireframe);
    setBgColor(settings.bgColor);
    setLightIntensity(settings.lightIntensity);
    setLightColor(settings.lightColor);
    setAnimationIndex(settings.animationIndex);
    setQuality(settings.quality || "high");
    setEnableShaders(
      settings.enableShaders !== undefined ? settings.enableShaders : true
    );
    setEnableEffects(settings.enableEffects || false);
    setShowGround(
      settings.showGround !== undefined ? settings.showGround : true
    );
    setGroundOpacity(settings.groundOpacity || 0.3);
    setShadowQuality(settings.shadowQuality || "high");
    setAntialiasing(
      settings.antialiasing !== undefined ? settings.antialiasing : true
    );
    setAmbientIntensity(settings.ambientIntensity || 0.4);
    setDirLight2Color(settings.dirLight2Color || "#ffffff");
    setDirLight2Pos(settings.dirLight2Pos || [-10, 10, -5]);
    setEnableLightBox(settings.enableLightBox || false);
    setCameraPoints(project.points || []); // <-- Restore camera points
    setCurrentProject(project);
    setMenuOpen(false);
  }, []);

  const handleDeleteProject = useCallback(
    (projectId) => {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (currentProject?.id === projectId) setCurrentProject(null);
    },
    [currentProject]
  );

  const handleResetSettings = useCallback(() => {
    setWireframe(false);
    setBgColor("sky");
    setLightIntensity(1.2);
    setLightColor("#ffffff");
    setAmbientIntensity(0.4);
    setDirLight2Color("#ffffff");
    setDirLight2Pos([-10, 10, -5]);
    setQuality("high");
    setEnableShaders(true);
    setEnableEffects(false);
    setShowGround(true);
    setGroundOpacity(0.3);
    setShadowQuality("high");
    setAntialiasing(true);
    setEnableLightBox(false);
  }, []);

  const handleModelLoaded = useCallback(() => {
    setAnimateCamera(true);
    // Reset animation flag after animation completes
    setTimeout(() => {
      setAnimateCamera(false);
    }, 2500);
  }, []);

  const handleReload = useCallback(() => window.location.reload(), []);

  // Memoized shadow map size calculation
  const shadowMapSize = useMemo(() => {
    const sizes = {
      low: 1024,
      medium: 2048,
      high: 4096,
      ultra: 8192,
    };
    return sizes[shadowQuality] || 2048;
  }, [shadowQuality]);

  // Memoized canvas configuration
  const canvasConfig = useMemo(
    () => ({
      camera: { position: [2, 2, 2], fov: 60 },
      style:
        bgColor === "sky" || bgColor === "#111111" || bgColor === "#e0e7ef"
          ? { background: "#111" }
          : { background: bgColor },
      dpr: antialiasing ? [1, 2] : 1,
      shadows: true,
      gl: {
        antialias: antialiasing,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
        physicallyCorrectLights: true,
        shadowMapEnabled: true,
        shadowMapType: enableShaders
          ? THREE.PCFSoftShadowMap
          : THREE.BasicShadowMap,
        powerPreference: quality === "ultra" ? "high-performance" : "default",
        preserveDrawingBuffer: true, // Enable for screenshots
        failIfMajorPerformanceCaveat: false,
      },
    }),
    [bgColor, antialiasing, enableShaders, quality]
  );

  // 2D/3D toggle handler
  const handleToggle2D3D = useCallback(() => setIs2D(v => !v), []);

  return (
    <div className="home-container">
      {/* Virtual Tour Controls */}
      {file && cameraPoints.length >= 2 && (
        <div
          style={{
            position: "fixed",
            left: 28,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 25,
            background: "#181818",
            border: "1.5px solid #333",
            borderRadius: 12,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 180,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
            Virtual Tour
          </div>
          
          <button
            style={{
              padding: "8px 16px",
              background: tourPlaying ? "#ff4444" : "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
            onClick={tourPlaying ? handleStopTour : handleStartTour}
          >
            {tourPlaying ? "Stop Tour" : "Start Tour"}
          </button>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "#ccc", fontSize: 12 }}>
              Speed: {tourSpeed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={tourSpeed}
              onChange={(e) => setTourSpeed(Number(e.target.value))}
              style={{
                width: "100%",
                height: 4,
                background: "#333",
                borderRadius: 2,
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>
        </div>
      )}

      {/* Save Camera Point Button at the bottom */}
      {file && !is2D && (
        <button
          style={{
            position: "fixed",
            left: "50%",
            bottom: 80,
            transform: "translateX(-50%)",
            zIndex: 21,
            padding: "10px 28px",
            background: "#222",
            color: "#fff",
            border: "1.5px solid #444",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 17,
            cursor: "pointer",
            opacity: 0.96,
            boxShadow: "0 2px 12px #000a",
          }}
          onClick={handleSaveCameraPoint}
        >
          Save Camera Point
        </button>
      )}

      {/* Points List at the bottom of the screen */}
      {file && cameraPoints.length > 0 && !is2D && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "#181818",
            color: "#fff",
            border: "1.5px solid #333",
            borderRadius: 12,
            padding: "10px 24px",
            minWidth: 160,
            boxShadow: "0 2px 12px #000a",
            maxWidth: "90vw",
            maxHeight: 120,
            overflowX: "auto",
            overflowY: "hidden",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginRight: 12 }}>
            Points:
          </div>
          {cameraPoints.slice(0, 3).map((pt, index) => (
            <div
              key={pt.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 16px",
                borderRadius: 7,
                background: "#232323",
                border: "1px solid #333",
                cursor: "pointer",
                fontSize: 15,
                color: "#fff",
                opacity: 0.92,
                fontWeight: 600,
                marginRight: 2,
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
              }}
              onClick={() => handleGoToPoint(pt)}
              onMouseOver={e => e.currentTarget.style.background = "#444"}
              onMouseOut={e => e.currentTarget.style.background = "#232323"}
            >
              {/* Ball icon */}
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #ffd700 70%, #b8860b 100%)",
                  boxShadow: "0 0 4px #ffb300",
                  marginRight: 2,
                  border: "1.5px solid #ffb300",
                }}
              />
              {index + 1}. {pt.name}
            </div>
          ))}
          {cameraPoints.length > 3 && (
            <button
              style={{
                padding: "7px 16px",
                borderRadius: 7,
                background: "#444",
                border: "1px solid #555",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
              onClick={() => setShowPointsManager(true)}
            >
              Manage ({cameraPoints.length})
            </button>
          )}
        </div>
      )}

      {/* Points Manager Modal */}
      {showPointsManager &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.6)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setShowPointsManager(false)}
          >
            <div
              style={{
                background: "#181818",
                borderRadius: 14,
                padding: 32,
                minWidth: 500,
                maxWidth: "90vw",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 4px 32px #000a",
                border: "1.5px solid #333",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 16 
              }}>
                <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>
                  Camera Points Manager
                </div>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ccc",
                    fontSize: 24,
                    cursor: "pointer",
                    padding: 4,
                  }}
                  onClick={() => setShowPointsManager(false)}
                >
                  ×
                </button>
              </div>

              {cameraPoints.length >= 2 && (
                <button
                  style={{
                    padding: "12px 20px",
                    background: "#4CAF50",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                  onClick={() => {
                    setShowPointsManager(false);
                    handleStartTour();
                  }}
                >
                  🎬 Create Virtual Tour ({cameraPoints.length} points)
                </button>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cameraPoints.map((pt, index) => (
                  <div
                    key={pt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "#232323",
                      border: "1px solid #333",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "radial-gradient(circle at 30% 30%, #ffd700 70%, #b8860b 100%)",
                          boxShadow: "0 0 4px #ffb300",
                          border: "1.5px solid #ffb300",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#000",
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ color: "#fff", fontWeight: 600 }}>
                        {pt.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={{
                          padding: "6px 12px",
                          background: "#444",
                          color: "#fff",
                          border: "1px solid #555",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                        onClick={() => {
                          setShowPointsManager(false);
                          handleGoToPoint(pt);
                        }}
                      >
                        Go To
                      </button>
                      <button
                        style={{
                          padding: "6px 12px",
                          background: "#ff4444",
                          color: "#fff",
                          border: "1px solid #ff6666",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                        onClick={() => handleRemovePoint(pt.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Save Camera Point Popup */}
      {showSavePopup &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.45)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setShowSavePopup(false)}
          >
            <div
              style={{
                background: "#181818",
                borderRadius: 14,
                padding: 32,
                minWidth: 320,
                boxShadow: "0 4px 32px #000a",
                border: "1.5px solid #333",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>
                Save Camera Point
              </div>
              <input
                type="text"
                placeholder="Enter point name"
                value={newPointName}
                onChange={(e) => setNewPointName(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 7,
                  border: "1.5px solid #444",
                  fontSize: 16,
                  background: "#222",
                  color: "#fff",
                  outline: "none",
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmSavePoint();
                }}
              />
              <button
                style={{
                  marginTop: 10,
                  padding: "10px 0",
                  background: "#fff",
                  color: "#181818",
                  border: "none",
                  borderRadius: 7,
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: "pointer",
                  opacity: 0.95,
                }}
                onClick={handleConfirmSavePoint}
              >
                Save
              </button>
            </div>
          </div>,
          document.body
        )}

      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        currentProject={currentProject}
        firstPerson={firstPerson}
        onToggleFirstPerson={handleToggleFirstPerson}
        onResetCamera={handleResetCamera}
        onScreenshot={handleScreenshot}
        onReload={handleReload}
        is2D={is2D}
        onToggle2D={handleToggle2D3D}
        hasModel={!!file}
        onSavePosition={handleSaveCameraPoint}
        onTogglePoints={() => setShowPointsManager(true)}
        savedPointsCount={cameraPoints.length}
      />

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        wireframe={wireframe}
        setWireframe={setWireframe}
        bgColor={bgColor}
        setBgColor={setBgColor}
        lightIntensity={lightIntensity}
        setLightIntensity={setLightIntensity}
        lightColor={lightColor}
        setLightColor={setLightColor}
        animations={animations}
        animationIndex={animationIndex}
        setAnimationIndex={setAnimationIndex}
        modelInfo={modelInfo}
        file={file}
        firstPerson={firstPerson}
        projects={projects}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        currentProject={currentProject}
        ambientIntensity={ambientIntensity}
        setAmbientIntensity={setAmbientIntensity}
        dirLight2Color={dirLight2Color}
        setDirLight2Color={setDirLight2Color}
        dirLight2Pos={dirLight2Pos}
        setDirLight2Pos={setDirLight2Pos}
        quality={quality}
        setQuality={setQuality}
        enableShaders={enableShaders}
        setEnableShaders={setEnableShaders}
        enableEffects={enableEffects}
        setEnableEffects={setEnableEffects}
        showGround={showGround}
        setShowGround={setShowGround}
        groundOpacity={groundOpacity}
        setGroundOpacity={setGroundOpacity}
        shadowQuality={shadowQuality}
        setShadowQuality={setShadowQuality}
        antialiasing={antialiasing}
        setAntialiasing={setAntialiasing}
        onResetSettings={handleResetSettings}
        enableLightBox={enableLightBox}
        setEnableLightBox={setEnableLightBox}
      />

      <main className="main-viewer">
        {file ? (
          <>
            {loadingProgress < 100 && (
              <div
                className="loading-bar"
                style={{
                  width: `${loadingProgress}%`,
                  height: 6,
                  background: "linear-gradient(90deg,#fff,#222 80%)",
                  borderRadius: 3,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 10,
                  transition: "width 0.2s",
                }}
              />
            )}
            <Canvas {...canvasConfig}>
              <CameraRefAttacher />
              {/* Enhanced lighting setup with quality-based shadows */}
              <ambientLight intensity={ambientIntensity} color="#ffffff" />

              {/* Main directional light with enhanced shadows */}
              <directionalLight
                position={[15, 25, 15]}
                intensity={lightIntensity}
                color={lightColor}
                castShadow={enableShaders}
                shadow-mapSize-width={shadowMapSize}
                shadow-mapSize-height={shadowMapSize}
                shadow-bias={-0.0005}
                shadow-normalBias={0.02}
                shadow-radius={enableShaders ? 10 : 1}
                shadow-camera-near={0.5}
                shadow-camera-far={100}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
              />

              {/* Secondary fill light */}
              <directionalLight
                position={dirLight2Pos}
                intensity={lightIntensity * 0.3}
                color={dirLight2Color}
                castShadow={enableShaders}
                shadow-mapSize-width={shadowMapSize / 2}
                shadow-mapSize-height={shadowMapSize / 2}
                shadow-bias={-0.001}
                shadow-radius={enableShaders ? 6 : 1}
                shadow-camera-near={1}
                shadow-camera-far={50}
                shadow-camera-left={-25}
                shadow-camera-right={25}
                shadow-camera-top={25}
                shadow-camera-bottom={-25}
              />

              {/* Rim light for better definition */}
              <directionalLight
                position={[-20, 15, -20]}
                intensity={lightIntensity * 0.2}
                color="#ffffff"
                castShadow={false}
              />

              {/* EXTREMELY HUGE Shadow light that follows the camera */}
              <CameraFollowerShadowLight />

              <Suspense fallback={<Html center>Loading...</Html>}>
                <ModelViewer
                  file={file}
                  wireframe={wireframe}
                  setModelInfo={setModelInfo}
                  setAnimations={setAnimations}
                  animationIndex={animationIndex}
                  setAnimationIndex={setAnimationIndex}
                  setLoadingProgress={setLoadingProgress}
                  onModelLoaded={handleModelLoaded}
                  shadowQuality={shadowQuality}
                  enableShaders={enableShaders}
                  showGround={showGround}
                  groundOpacity={groundOpacity}
                  cameraPoints={cameraPoints}
                  enableLightBox={enableLightBox}
                />
              </Suspense>

              {/* Virtual Tour System */}
              <VirtualTour
                cameraPoints={cameraPoints}
                isPlaying={tourPlaying}
                speed={tourSpeed}
                onComplete={handleTourComplete}
              />

              {is2D ? null : (
                firstPerson ? (
                  <FirstPersonController enabled={true} />
                ) : (
                  <OrbitControls
                    makeDefault
                    key={String(resetCameraFlag)}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    enableDamping={true}
                    dampingFactor={0.08}
                    minDistance={0}
                    maxDistance={Infinity}
                  />
                )
              )}
              {bgColor === "sky" && (
                <Environment preset="sunset" background blur={0.1} />
              )}
              {bgColor === "#111111" && (
                <Environment preset="night" background blur={0.1} />
              )}
              {bgColor === "#e0e7ef" && (
                <Environment preset="city" background blur={0.1} />
              )}
              {/* If in 2D mode, set camera and controls for 2D top-down view */}
              {is2D && <TopDown2DCamera />}
            </Canvas>
          </>
        ) : (
          <div className="upload-overlay">
            <FileUpload onFileSelect={setFile} />
          </div>
        )}
      </main>
    </div>
  );
}

// TopDown2DCamera component to force camera to top-down orthographic view with pan/zoom
function TopDown2DCamera() {
  const { camera, gl, set } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    // Switch to orthographic camera for 2D
    const aspect = gl.domElement.width / gl.domElement.height;
    const d = 10;
    const orthoCam = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      0.01,
      1000
    );
    orthoCam.position.set(0, 20, 0);
    orthoCam.up.set(0, 0, -1);
    orthoCam.lookAt(0, 0, 0);
    orthoCam.zoom = 2.5;
    orthoCam.updateProjectionMatrix();
    set({ camera: orthoCam });

    // Show mouse cursor in 2D mode
    const canvas = gl.domElement;
    const prevCursor = canvas.style.cursor;
    canvas.style.cursor = "default";

    gl.renderLists.dispose();

    return () => {
      set({ camera });
      canvas.style.cursor = prevCursor;
      gl.renderLists.dispose();
    };
    // eslint-disable-next-line
  }, []);

  // Add OrbitControls for pan/zoom only (disable rotate)
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={true}
      enableZoom={true}
      enableRotate={false}
      dampingFactor={0.1}
      minZoom={0.2}
      maxZoom={10}
      mouseButtons={{
        LEFT: 0, // disable left button rotate
        MIDDLE: 1,
        RIGHT: 2,
      }}
      touches={{
        ONE: 2, // pan with one finger
        TWO: 1, // zoom with two fingers
      }}
    />
  );
}

// EXTREMELY HUGE Camera Follower Shadow Light
function CameraFollowerShadowLight() {
  const { camera, scene } = useThree();
  const lightRef = useRef();

  useFrame(() => {
    if (lightRef.current && camera) {
      // Position the light much farther from camera for massive coverage
      const offset = new THREE.Vector3(0, 50, -150).applyQuaternion(camera.quaternion);
      lightRef.current.position.copy(camera.position).add(offset);
      
      const target = new THREE.Object3D();
      target.position.copy(camera.position).add(
        new THREE.Vector3(0, 0, -200).applyQuaternion(camera.quaternion)
      );
      lightRef.current.target.position.copy(target.position);
      
      if (!scene.children.includes(lightRef.current.target)) {
        scene.add(lightRef.current.target);
      }
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={3.5} // Increased intensity
      color="#fffbe0"
      castShadow
      shadow-mapSize-width={8192} // Increased shadow map size
      shadow-mapSize-height={8192}
      shadow-bias={-0.0001}
      shadow-radius={25} // Increased shadow radius
      shadow-camera-near={1}
      shadow-camera-far={1000} // Massive far distance
      shadow-camera-left={-500} // HUGE shadow camera bounds
      shadow-camera-right={500}
      shadow-camera-top={500}
      shadow-camera-bottom={-500}
    />
  );
}

export default View3d;