import { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// Components
import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import SideMenu from "./components/SideMenu";

// Styles
import "./styles/App.css";

// Camera controller for orbit and walk mode
function CameraController({ object, resetFlag, firstPerson }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!object || firstPerson) return;
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;
    const angle = Math.PI / 6;
    camera.position.set(
      center.x + distance * Math.cos(angle),
      center.y + distance * 0.5,
      center.z + distance * Math.sin(angle)
    );
    camera.lookAt(center);
    camera.near = maxDim / 1000;
    camera.far = maxDim * 1000;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.copy(center);
      controls.update();
      controls.minDistance = 0;
      controls.maxDistance = Infinity;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI;
      controls.enablePan = true;
    }
  }, [object, camera, controls, resetFlag, firstPerson]);
  return null;
}

// Walk mode controller with mouse wheel speed adjustment
function FirstPersonController({ enabled }) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});
  // Lower walk/run speed defaults
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
      setWalkSpeed((prev) => Math.max(50, Math.min(2000, prev - e.deltaY * 2)));
      setRunSpeed((prev) => Math.max(100, Math.min(4000, prev - e.deltaY * 4)));
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

// Model loader and viewer
function ModelViewer({
  file,
  wireframe,
  setModelInfo,
  setAnimations,
  animationIndex,
  setLoadingProgress,
}) {
  const [model, setModel] = useState(null);
  const [clock] = useState(() => new THREE.Clock());
  const [modelBounds, setModelBounds] = useState(null);
  const requestRef = useRef();

  // Calculate model bounds for dynamic shadow plane sizing
  const calculateModelBounds = (obj) => {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { box, size, center };
  };

  useEffect(() => {
    let isMounted = true;
    setModel(null);
    setModelInfo({});
    setAnimations([]);
    setLoadingProgress(0);
    setModelBounds(null);

    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    async function loadModelAsync() {
      // Enhanced shadow and wireframe application
      function applyEnhancedShadows(obj) {
        obj.traverse((child) => {
          if (child.isMesh && child.material) {
            child.castShadow = true;
            child.receiveShadow = true;

            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((mat) => {
              mat.wireframe = wireframe;

              // Enhanced shadow properties
              mat.shadowSide = THREE.DoubleSide;

              // Improve shadow quality for different material types
              if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                mat.roughness = mat.roughness || 0.5;
                mat.metalness = mat.metalness || 0.0;
              }

              // Handle transparent materials
              if (mat.transparent && mat.opacity < 1) {
                mat.alphaTest = 0.1;
              }

              // Force material updates
              mat.needsUpdate = true;
            });

            // Optimize geometry
            if (child.geometry) {
              if (!child.geometry.attributes.normal) {
                child.geometry.computeVertexNormals();
              }
              child.geometry.computeBoundingSphere();
              child.geometry.computeBoundingBox();
            }
          }
        });
      }

      function extractInfo(obj) {
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
      }

      try {
        let loadedModel = null;

        if (ext === "fbx") {
          const arrayBuffer = await file.arrayBuffer();
          const loader = new FBXLoader();
          loader.setResourcePath("./");
          loadedModel = loader.parseAsync
            ? await loader.parseAsync(arrayBuffer, "")
            : loader.parse(arrayBuffer, "");
        } else if (ext === "obj") {
          const text = await file.text();
          const loader = new OBJLoader();
          loadedModel = loader.parse(text);
        } else if (ext === "gltf" || ext === "glb") {
          const loader = new GLTFLoader();
          loader.manager.onProgress = (_, loaded, total) =>
            setLoadingProgress(Math.round((loaded / total) * 100));

          loadedModel = await new Promise((resolve, reject) => {
            loader.load(
              URL.createObjectURL(file),
              (gltf) => resolve(gltf.scene),
              undefined,
              () => reject(new Error("Failed to load GLTF/GLB file"))
            );
          });
        } else {
          throw new Error("Unsupported file format");
        }

        if (loadedModel && isMounted) {
          applyEnhancedShadows(loadedModel);
          const bounds = calculateModelBounds(loadedModel);

          setModel(loadedModel);
          setModelBounds(bounds);
          setModelInfo(extractInfo(loadedModel));
          setAnimations(loadedModel.animations || []);
        }
      } catch (error) {
        if (isMounted) {
          setModelInfo({ error: error.message || "Failed to load model." });
        }
      }
    }

    loadModelAsync();
    return () => {
      isMounted = false;
    };
  }, [file, wireframe, setModelInfo, setAnimations, setLoadingProgress]);

  // Animation handling
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

  useEffect(() => {
    if (model) setLoadingProgress(100);
  }, [model, setLoadingProgress]);

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
                width: `${Math.max(5, window.loadingProgress || 0)}%`,
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
            {window.loadingProgress
              ? `${window.loadingProgress}%`
              : "Starting..."}
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

  // Dynamic shadow plane based on model bounds
  const shadowPlaneSize = modelBounds
    ? Math.max(modelBounds.size.x, modelBounds.size.z) * 3
    : 200;
  const shadowPlaneY = modelBounds ? modelBounds.box.min.y - 0.01 : -0.01;

  return (
    <>
      <primitive object={model} />

      {/* Enhanced shadow catcher plane with dynamic sizing */}
      <mesh
        receiveShadow
        position={[0, shadowPlaneY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[shadowPlaneSize, shadowPlaneSize]} />
        <shadowMaterial opacity={0.4} transparent={true} color="#000000" />
      </mesh>

      {/* Optional: Add a subtle reflection plane for enhanced visual appeal */}
      <mesh
        receiveShadow
        position={[0, shadowPlaneY - 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[shadowPlaneSize, shadowPlaneSize]} />
        <meshStandardMaterial
          transparent={true}
          opacity={0.1}
          color="#ffffff"
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      <CameraController
        object={model}
        resetFlag={animationIndex}
        firstPerson={window.__firstPersonActive}
      />
    </>
  );
}

function createEnhancedLighting(
  lightIntensity,
  lightColor,
  ambientIntensity,
  dirLight2Color,
  dirLight2Pos
) {
  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={ambientIntensity} color="#404040" />

      {/* Main directional light with enhanced shadow settings */}
      <directionalLight
        position={[15, 25, 15]}
        intensity={lightIntensity}
        color={lightColor}
        castShadow={true}
        shadow-mapSize-width={4096} // Higher resolution shadows
        shadow-mapSize-height={4096}
        shadow-bias={-0.0005} // Reduced shadow acne
        shadow-normalBias={0.02}
        shadow-radius={10} // Softer shadows
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Secondary directional light for fill lighting */}
      <directionalLight
        position={dirLight2Pos}
        intensity={lightIntensity * 0.3}
        color={dirLight2Color}
        castShadow={true}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.001}
        shadow-radius={6}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />

      {/* Rim light for better model definition */}
      <directionalLight
        position={[-20, 15, -20]}
        intensity={lightIntensity * 0.2}
        color="#b3d9ff"
        castShadow={false} // No shadows for rim light to avoid conflicts
      />

      {/* Subtle bottom light to reduce harsh shadows */}
      <directionalLight
        position={[0, -10, 0]}
        intensity={lightIntensity * 0.1}
        color="#ffffff"
        castShadow={false}
      />
    </>
  );
}

function App() {
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

  // Track loading progress globally for the loading bar in ModelViewer
  useEffect(() => {
    window.loadingProgress = loadingProgress;
    return () => {
      window.loadingProgress = 0;
    };
  }, [loadingProgress]);

  const handleScreenshot = () => {
    const canvas = document.querySelector("canvas");
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
    };
    setProjects((prev) => [...prev, project]);
    setCurrentProject(project);
  };
  const handleLoadProject = (project) => {
    setFile(project.file);
    setWireframe(project.settings.wireframe);
    setBgColor(project.settings.bgColor);
    setLightIntensity(project.settings.lightIntensity);
    setLightColor(project.settings.lightColor);
    setAnimationIndex(project.settings.animationIndex);
    setCurrentProject(project);
    setMenuOpen(false);
  };
  const handleDeleteProject = (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (currentProject?.id === projectId) setCurrentProject(null);
  };
  // Add reload handler
  const handleReload = () => window.location.reload();

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
        // Add reload button handler as a prop if you want to show it in Header
        onReload={handleReload}
      />

      {/* Add a reload button somewhere in your UI */}
      <div
        style={{ position: "absolute", top: 16, right: 16, zIndex: 100 }}
      ></div>

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
        setLightColor={setDirLight2Color}
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
            <Canvas
              camera={{ position: [2, 2, 2], fov: 60 }}
              style={
                bgColor === "sky" ||
                bgColor === "#111111" ||
                bgColor === "#e0e7ef"
                  ? { background: "#111" }
                  : { background: bgColor }
              }
              dpr={[1, 2]}
              shadows
              gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                outputColorSpace: THREE.SRGBColorSpace,
                physicallyCorrectLights: true,
                shadowMapEnabled: true,
                shadowMapType: THREE.PCFSoftShadowMap,
                powerPreference: "high-performance",
                preserveDrawingBuffer: false,
                failIfMajorPerformanceCaveat: false,
              }}
            >
              {/* Lighting setup with shadows enabled */}
              <ambientLight intensity={ambientIntensity} color="#fff" />
              <directionalLight
                position={[10, 20, 10]}
                intensity={lightIntensity}
                color={lightColor}
                castShadow={true}
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-bias={-0.001}
                shadow-radius={8}
                shadow-camera-near={1}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
                shadow-normalBias={0.01}
              />
              <directionalLight
                position={dirLight2Pos}
                intensity={lightIntensity * 0.4}
                color={dirLight2Color}
                castShadow={true}
              />
              <directionalLight
                position={[-15, 10, -15]}
                intensity={0.15}
                color="#fffbe6"
                castShadow={true}
              />
              <Suspense fallback={<Html center>Loading...</Html>}>
                <ModelViewer
                  file={file}
                  wireframe={wireframe}
                  setModelInfo={setModelInfo}
                  setAnimations={setAnimations}
                  animationIndex={animationIndex}
                  setAnimationIndex={setAnimationIndex}
                  setLoadingProgress={setLoadingProgress}
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
                  dampingFactor={0.08}
                  minDistance={0}
                  maxDistance={Infinity}
                />
              )}
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
