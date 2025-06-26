import { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PointerLockControls,
  Environment,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer, Bloom, ToneMapping, BrightnessContrast, HueSaturation, Vignette, ChromaticAberration, SSAO, SSR } from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';

// Components
import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import SideMenu from "./components/SideMenu";
import LoadingScreen from "./components/LoadingScreen";

// Styles
import "./styles/App.css";

function FitCamera({ object }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!object) return;
    // Only fit camera if not in walk mode (firstPerson)
    const isFirstPerson = window.__firstPersonActive;
    if (isFirstPerson) return;

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Camera placement: place camera at the nearest corner with a small offset
    camera.position.set(
      center.x - size.x / 2 - 2,
      center.y - size.y / 2 - 2,
      center.z - size.z / 2 - 2
    );
    camera.near = 0.01;
    camera.far = 100000;
    camera.updateProjectionMatrix();
    camera.lookAt(center);
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
  }, [object, camera, controls]);
  return null;
}

// Enhanced Camera Controller
function CameraController({ object, resetFlag, firstPerson, onCameraChange }) {
  const { camera, controls } = useThree();
  const [isFirstPerson, setIsFirstPerson] = useState(false);

  useEffect(() => {
    setIsFirstPerson(firstPerson);
    // Do not change camera position in walk mode
    if (firstPerson) return;
    onCameraChange?.(firstPerson);
  }, [firstPerson, camera, onCameraChange]);

  useEffect(() => {
    if (!object || isFirstPerson) return;

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.8;
    const angle = Math.PI / 4;
    
    camera.position.set(
      center.x + distance * Math.cos(angle),
      center.y + distance * 0.6,
      center.z + distance * Math.sin(angle)
    );
    
    camera.lookAt(center);
    camera.near = maxDim / 2000;
    camera.far = maxDim * 2000;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.copy(center);
      controls.update();
      controls.minDistance = 0;
      controls.maxDistance = Infinity;
      controls.enablePan = true;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    }
  }, [object, camera, controls, resetFlag, firstPerson]);
  return null;
}

// Enhanced First Person Controller
function FirstPersonController({ enabled }) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});

  const settings = {
    walkSpeed: 800,
    runSpeed: 1600,
    mouseSensitivity: 0.002,
    gravity: 800
  };

  const state = useRef({
    pitch: 0,
    yaw: 0,
    isPointerLocked: false,
    speedBoost: false // track if space is held for speed boost
  });

  useEffect(() => {
    if (!enabled) return;
    const canvas = gl.domElement;
    const handlePointerLockChange = () => {
      state.current.isPointerLocked = document.pointerLockElement === canvas;
      if (state.current.isPointerLocked) document.addEventListener("mousemove", handleMouseMove);
      else document.removeEventListener("mousemove", handleMouseMove);
    };
    const handleMouseMove = (event) => {
      if (!state.current.isPointerLocked) return;
      state.current.yaw -= event.movementX * 0.002;
      state.current.pitch -= event.movementY * 0.002;
      state.current.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.current.pitch));
      camera.rotation.set(state.current.pitch, state.current.yaw, 0, "YXZ");
    };
    const handleClick = () => canvas.requestPointerLock && canvas.requestPointerLock();
    canvas.addEventListener("click", handleClick);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    return () => {
      canvas.removeEventListener("click", handleClick);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [enabled, camera, gl]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      keys.current[event.code] = true;

      // Space: speed boost while held (no jump/fall)
      if (event.code === "Space") {
        state.current.speedBoost = true;
      }
    };

    const handleKeyUp = (event) => {
      keys.current[event.code] = false;

      // Space released: remove speed boost
      if (event.code === "Space") {
        state.current.speedBoost = false;
      }
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

      // If space is held, use runSpeed * 2 as a speed boost
      let speed =
        state.current.speedBoost
          ? settings.runSpeed * 2
          : (keys.current.ShiftLeft || keys.current.ShiftRight
              ? settings.runSpeed
              : settings.walkSpeed);

      const moveVector = direction.current
        .clone()
        .applyEuler(camera.rotation)
        .multiplyScalar(speed * delta);

      camera.position.add(moveVector);
    }
  });
  return null;
}

function ModelViewer({
  file,
  wireframe,
  setModelInfo,
  setAnimations,
  animationIndex,
  setAnimationIndex,
  setLoadingProgress,
}) {
  const [model, setModel] = useState(null);
  const [clock] = useState(() => new THREE.Clock());
  const requestRef = useRef();

  useEffect(() => {
    let isMounted = true;
    setModel(null); setModelInfo({}); setAnimations([]); setLoadingProgress(0);
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();

    async function loadModelAsync() {
      function applyWireframe(obj) {
        obj.traverse((child) => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => (mat.wireframe = wireframe));
            } else {
              child.material.wireframe = wireframe;
            }
          }
        });
      }
      function extractInfo(obj) {
        let meshCount = 0, vertexCount = 0, triangleCount = 0;
        obj.traverse((child) => {
          if (child.isMesh) {
            meshCount++;
            if (child.geometry) {
              vertexCount += child.geometry.attributes.position?.count || 0;
              if (child.geometry.index) {
                triangleCount += child.geometry.index.count / 3;
              } else {
                triangleCount +=
                  (child.geometry.attributes.position?.count || 0) / 3;
              }
            }
          }
        });
        return { meshCount, vertexCount, triangleCount };
      }
      try {
        if (ext === "fbx") {
          const arrayBuffer = await file.arrayBuffer();
          const loader = new FBXLoader();
          loader.setResourcePath(
            file.webkitRelativePath ? file.webkitRelativePath : "./"
          );
          let fbx;
          if (loader.parseAsync) {
            fbx = await loader.parseAsync(arrayBuffer, "");
          } else {
            fbx = loader.parse(arrayBuffer, "");
          }
          applyWireframe(fbx);
          if (!isMounted) return;
          setModel(fbx);
          setModelInfo(extractInfo(fbx));
          setAnimations(fbx.animations || []);
        } else if (ext === "obj") {
          const text = await file.text();
          const loader = new OBJLoader();
          const obj = loader.parse(text);
          applyWireframe(obj);
          if (!isMounted) return;
          setModel(obj);
          setModelInfo(extractInfo(obj));
          setAnimations([]);
        } else if (ext === "gltf" || ext === "glb") {
          const loader = new GLTFLoader();
          loader.manager.onProgress = (_, loaded, total) => setLoadingProgress(Math.round((loaded / total) * 100));
          await new Promise((resolve, reject) => {
            loader.load(
              URL.createObjectURL(file),
              (gltf) => {
                if (!isMounted) return;
                const scene = gltf.scene;
                applyWireframe(scene);
                setModel(scene);
                setModelInfo(extractInfo(scene));
                setAnimations(gltf.animations || []);
                resolve();
              },
              undefined,
              () => {
                setModelInfo({
                  error:
                    "Failed to load GLTF/GLB file. Please check the file format.",
                });
                reject();
              }
            );
          });
        } else {
          setModelInfo({
            error:
              "Unsupported file format. Please use FBX, OBJ, GLTF, or GLB files.",
          });
        }
      } catch {
        setModelInfo({ error: "Failed to load model." });
      }
    }
    loadModelAsync();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line
  }, [file, wireframe]);

  // Animation handling
  useEffect(() => {
    if (!model) return;
    if (!model.animations || model.animations.length === 0) return;
    const mixerInstance = new THREE.AnimationMixer(model);
    setMixer(mixerInstance);
    if (model.animations[animationIndex]) {
      mixer.stopAllAction();
      mixer.clipAction(model.animations[animationIndex]).play();
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

  useEffect(() => { if (model) setLoadingProgress(100); }, [model, setLoadingProgress]);

  return model ? (
    <>
      <primitive object={model} />
      <CameraController
        object={model}
        resetFlag={animationIndex} // or resetCameraFlag if you want
        firstPerson={window.__firstPersonActive}
      />
    </>
  ) : (
    <Html center>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "#fff",
          fontSize: 20,
          padding: 32,
          background: "rgba(0,0,0,0.96)",
          borderRadius: 16,
          boxShadow: "0 4px 32px 0 rgba(0,0,0,0.45)",
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
          style={{ opacity: 0.92 }}
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
        <div style={{ marginTop: 18, marginBottom: 12, fontWeight: 600, fontSize: 22 }}>
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
            boxShadow: "0 1px 8px #000a",
          }}
        >
          <div
            style={{
              width: `${Math.max(5, window.loadingProgress || 0)}%`,
              height: "100%",
              background: "linear-gradient(90deg,#fff,#1976d2 80%)",
              borderRadius: 5,
              transition: "width 0.2s",
              boxShadow: "0 0 8px #1976d2cc",
            }}
          />
        </div>
        <div style={{ fontSize: 16, color: "#fff", opacity: 0.85, marginTop: 2 }}>
          {window.loadingProgress
            ? `${window.loadingProgress}%`
            : "Starting..."}
        </div>
        <div style={{
          marginTop: 18,
          fontSize: 13,
          color: "#aaa",
          opacity: 0.7,
          letterSpacing: 0.1,
          textAlign: "center"
        }}>
          Please wait while your 3D model is being processed.<br />
          Large files may take a few moments.
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
          svg {
            animation: spin 1.2s linear infinite;
          }
        `}</style>
      </div>
    </Html>
  );
}

function FirstPersonCamera({ enabled }) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const move = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    shift: false,
  });
  // Increase walk mode speed
  const baseSpeed = 600;
  const fastSpeed = 1800;
  const jumpVelocity = 250;
  const isOnGround = useRef(true);

  // Mouse sensitivity
  const sensitivity = 0.002;
  const pitch = useRef(0);
  const yaw = useRef(0);

  // Remember camera position/rotation on walk mode entry
  useEffect(() => {
    window.__firstPersonActive = enabled;
    if (!enabled) return;
    // Do not reset camera position/rotation, just keep current
    // Optionally, you could store/restore camera state here if needed
    // (no-op)
    return () => {
      window.__firstPersonActive = false;
    };
  }, [enabled, camera]);

  // Pointer lock for mouse look
  useEffect(() => {
    if (!enabled) return;
    const canvas = gl.domElement;

    function onPointerLockChange() {
      if (document.pointerLockElement === canvas) {
        document.addEventListener("mousemove", onMouseMove, false);
      } else {
        document.removeEventListener("mousemove", onMouseMove, false);
      }
    }

    function onMouseMove(e) {
      yaw.current -= e.movementX * sensitivity;
      pitch.current -= e.movementY * sensitivity;
      pitch.current = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, pitch.current)
      );
      camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    }

    canvas.requestPointerLock =
      canvas.requestPointerLock || canvas.mozRequestPointerLock;
    canvas.addEventListener("click", () => {
      canvas.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", onPointerLockChange, false);

    return () => {
      document.removeEventListener(
        "pointerlockchange",
        onPointerLockChange,
        false
      );
      document.removeEventListener("mousemove", onMouseMove, false);
    };
  }, [enabled, gl, camera]);

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          move.current.forward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          move.current.left = true;
          break;
        case "ArrowDown":
        case "KeyS":
          move.current.backward = true;
          break;
        case "ArrowRight":
        case "KeyD":
          move.current.right = true;
          break;
        case "Space":
          if (isOnGround.current) {
            velocity.current.y = jumpVelocity;
            isOnGround.current = false;
          }
          break;
        case "ShiftLeft":
        case "ShiftRight":
          move.current.shift = true;
          break;
        case "KeyQ":
          move.current.down = true;
          break;
        case "KeyE":
          move.current.up = true;
          break;
        default:
          break;
      }
    };
    const handleKeyUp = (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          move.current.forward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          move.current.left = false;
          break;
        case "ArrowDown":
        case "KeyS":
          move.current.backward = false;
          break;
        case "ArrowRight":
        case "KeyD":
          move.current.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          move.current.shift = false;
          break;
        case "KeyQ":
          move.current.down = false;
          break;
        case "KeyE":
          move.current.up = false;
          break;
        default:
          break;
      }
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
    // Movement direction
    direction.current.set(0, 0, 0);
    if (move.current.forward) direction.current.z -= 1;
    if (move.current.backward) direction.current.z += 1;
    if (move.current.left) direction.current.x -= 1;
    if (move.current.right) direction.current.x += 1;
    if (move.current.up) direction.current.y += 1;
    if (move.current.down) direction.current.y -= 1;
    direction.current.normalize();

    // Speed
    let currentSpeed = move.current.shift ? fastSpeed : baseSpeed;

    // Apply movement
    if (direction.current.length() > 0) {
      const moveVector = new THREE.Vector3(
        direction.current.x,
        direction.current.y,
        direction.current.z
      )
        .applyEuler(camera.rotation)
        .multiplyScalar(currentSpeed * delta);
      camera.position.add(moveVector);
    }

    // Simple gravity and jump
    if (!isOnGround.current) {
      velocity.current.y -= 500 * delta; // gravity
      camera.position.y += velocity.current.y * delta;
      if (camera.position.y <= 1.6) {
        // ground level
        camera.position.y = 1.6;
        velocity.current.y = 0;
        isOnGround.current = true;
      }
    }
  });

  return enabled ? null : null;
}

function App() {
  const [file, setFile] = useState(null);
  const [wireframe, setWireframe] = useState(false);
  const [bgColor, setBgColor] = useState("sky");
  const [modelInfo, setModelInfo] = useState({});
  const [animations, setAnimations] = useState([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [lightIntensity, setLightIntensity] = useState(1.5);
  const [lightColor, setLightColor] = useState("#ffffff");
  const [firstPerson, setFirstPerson] = useState(false);
  const [resetCameraFlag, setResetCameraFlag] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [ambientIntensity, setAmbientIntensity] = useState(0.6);
  const [dirLight2Color, setDirLight2Color] = useState("#ffffff");
  const [dirLight2Pos, setDirLight2Pos] = useState([-10, 10, -5]);
  
  // New quality and effects settings
  const [quality, setQuality] = useState('high');
  const [enableShaders, setEnableShaders] = useState(true);
  const [enableEffects, setEnableEffects] = useState(true);
  const [showGround, setShowGround] = useState(true);
  const [groundOpacity, setGroundOpacity] = useState(0.8);
  const [shadowQuality, setShadowQuality] = useState('high');
  const [antialiasing, setAntialiasing] = useState(true);

  const canvasRef = useRef();

  // Track loading progress globally
  useEffect(() => {
    window.loadingProgress = loadingProgress;
    return () => { window.loadingProgress = 0; };
  }, [loadingProgress]);

  const handleScreenshot = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-screenshot-${new Date()
      .toISOString()
      .slice(0, 10)}.png`;
    a.click();
  };

  const handleResetCamera = () => setResetCameraFlag((f) => !f);
  const handleToggleFirstPerson = () => setFirstPerson((f) => !f);

  const handleSaveProject = () => {
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
      },
      savedAt: new Date().toISOString(),
      thumbnail: null, // Could add thumbnail generation here
    };
    setProjects((prev) => [...prev, project]);
    setCurrentProject(project);
  };
  const handleLoadProject = (project) => {
    setFile(project.file);
    const settings = project.settings;
    setWireframe(settings.wireframe);
    setBgColor(settings.bgColor);
    setLightIntensity(settings.lightIntensity);
    setLightColor(settings.lightColor);
    setAnimationIndex(settings.animationIndex);
    setQuality(settings.quality || 'high');
    setEnableShaders(settings.enableShaders !== false);
    setEnableEffects(settings.enableEffects !== false);
    setShowGround(settings.showGround !== false);
    setGroundOpacity(settings.groundOpacity || 0.8);
    setShadowQuality(settings.shadowQuality || 'high');
    setAntialiasing(settings.antialiasing !== false);
    setAmbientIntensity(settings.ambientIntensity || 0.6);
    setDirLight2Color(settings.dirLight2Color || '#ffffff');
    setDirLight2Pos(settings.dirLight2Pos || [-10, 10, -5]);
    setCurrentProject(project);
    setMenuOpen(false);
  };
  const handleDeleteProject = (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (currentProject?.id === projectId) setCurrentProject(null);
  };

  return (
    <div className="app-container">
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        currentProject={currentProject}
        firstPerson={firstPerson}
        onToggleFirstPerson={handleToggleFirstPerson}
        onResetCamera={handleResetCamera}
        onScreenshot={handleScreenshot}
      />

      {/* Add a reload button somewhere in your UI */}
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 100 }}>
      </div>

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
      />

      <main className="main-viewer" ref={canvasRef}>
        {file ? (
          <>
            {loadingProgress < 100 && (
              <div
                className="loading-bar"
                style={{
                  width: `${loadingProgress}%`,
                  height: 6,
                  background: "linear-gradient(90deg,#1976d2,#42a5f5)",
                  borderRadius: 3,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 10,
                  transition: "width 0.2s",
                }}
              />
            )}
            <Canvas
              camera={{ position: [2, 2, 2], fov: 60 }}
              style={
                bgColor === "sky" ||
                bgColor === "#111111" ||
                bgColor === "#e0e7ef"
                  ? {}
                  : { background: bgColor }
              }
              dpr={getPixelRatio()}
              shadows={enableShaders}
              gl={{
                antialias: antialiasing,
                toneMapping: THREE.ACESFilmicToneMapping,
                outputColorSpace: THREE.SRGBColorSpace,
                physicallyCorrectLights: true,
                shadowMapEnabled: true,
                shadowMapType: THREE.VSMShadowMap,
                // Prevent blocking main thread during heavy loads
                powerPreference: "high-performance",
                preserveDrawingBuffer: true,
                alpha: false,
                depth: true,
                stencil: false,
                premultipliedAlpha: true,
              }}
            >
              {/* Ambient light for base illumination */}
              <ambientLight intensity={ambientIntensity} color="#f0f0f0" />

              {/* Main directional light with ultra high quality shadows */}
              <directionalLight
                position={[30, 60, 30]}
                intensity={lightIntensity * 1.2}
                color={lightColor}
                castShadow
                shadow-mapSize-width={8192}
                shadow-mapSize-height={8192}
                shadow-bias={-0.00015}
                shadow-radius={8}
                shadow-camera-near={1}
                shadow-camera-far={200}
                shadow-camera-left={-80}
                shadow-camera-right={80}
                shadow-camera-top={80}
                shadow-camera-bottom={-80}
                shadow-normalBias={0.01}
              />

              {/* Multiple fill lights for complex shadowing and color bounce */}
              <directionalLight
                position={dirLight2Pos}
                intensity={lightIntensity * 0.5}
                color={dirLight2Color}
                castShadow
                shadow-mapSize-width={4096}
                shadow-mapSize-height={4096}
                shadow-bias={-0.0002}
                shadow-radius={6}
                shadow-camera-near={1}
                shadow-camera-far={100}
                shadow-camera-left={-40}
                shadow-camera-right={40}
                shadow-camera-top={40}
                shadow-camera-bottom={-40}
                shadow-normalBias={0.01}
              />

              <directionalLight
                position={[-30, 20, -30]}
                intensity={lightIntensity * 0.18}
                color="#b0c4ff"
                castShadow={false}
              />

              {/* Area light for soft indirect illumination */}
              <rectAreaLight
                position={[0, 30, 0]}
                intensity={10}
                color="#ffffff"
                width={100}
                height={100}
                lookAt={[0, 0, 0]}
                penumbra={1}
              />

              {/* Soft ground shadow with high resolution */}
              <mesh receiveShadow position={[0, -0.01, 0]}>
                <planeGeometry args={[400, 400]} />
                <shadowMaterial opacity={0.22} />
              </mesh>

              {/* Contact shadows for extra realism under objects */}
              <mesh position={[0, -0.009, 0]} receiveShadow>
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial
                  color="#000"
                  transparent
                  opacity={0.08}
                  roughness={1}
                  metalness={0}
                />
              </mesh>

              {/* Optionally, add soft contact shadows from drei */}
              {/* <ContactShadows
                position={[0, -0.01, 0]}
                opacity={0.35}
                width={80}
                height={80}
                blur={2.5}
                far={40}
                resolution={2048}
                color="#000000"
              /> */}

              <Suspense fallback={
                <Html center>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      color: "#fff",
                      fontSize: 20,
                      padding: 32,
                      background: "rgba(0,0,0,0.96)",
                      borderRadius: 16,
                      boxShadow: "0 4px 32px 0 rgba(0,0,0,0.45)",
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
                      style={{ opacity: 0.92 }}
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
                    <div style={{ marginTop: 18, marginBottom: 12, fontWeight: 600, fontSize: 22 }}>
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
                        boxShadow: "0 1px 8px #000a",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(5, window.loadingProgress || 0)}%`,
                          height: "100%",
                          background: "linear-gradient(90deg,#fff,#1976d2 80%)",
                          borderRadius: 5,
                          transition: "width 0.2s",
                          boxShadow: "0 0 8px #1976d2cc",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 16, color: "#fff", opacity: 0.85, marginTop: 2 }}>
                      {window.loadingProgress
                        ? `${window.loadingProgress}%`
                        : "Starting..."}
                    </div>
                    <div style={{
                      marginTop: 18,
                      fontSize: 13,
                      color: "#aaa",
                      opacity: 0.7,
                      letterSpacing: 0.1,
                      textAlign: "center"
                    }}>
                      Please wait while your 3D model is being processed.<br />
                      Large files may take a few moments.
                    </div>
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg);}
                        100% { transform: rotate(360deg);}
                      }
                      svg {
                        animation: spin 1.2s linear infinite;
                      }
                    `}</style>
                  </div>
                </Html>
              }>
                <ModelViewer
                  file={file}
                  wireframe={wireframe}
                  setModelInfo={setModelInfo}
                  setAnimations={setAnimations}
                  animationIndex={animationIndex}
                  setLoadingProgress={setLoadingProgress}
                  quality={quality}
                  enableShaders={enableShaders}
                />
              </Suspense>

              {firstPerson ? (
                <FirstPersonController enabled={true} />
              ) : (
                <OrbitControls
                  makeDefault
                  key={String(resetCameraFlag)}
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  enableDamping={true}
                  dampingFactor={0.05}
                  minDistance={0}
                  maxDistance={Infinity}
                  maxPolarAngle={Math.PI}
                  minPolarAngle={0}
                />
              )}
              {/* Use a sky HDR background for all presets */}
              {bgColor === "sky" && <Environment preset="sunset" background />}
              {bgColor === "#111111" && (
                <Environment preset="night" background />
              )}
              {bgColor === "#e0e7ef" && (
                <Environment preset="city" background />
              )}
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

export default App;