import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import useNodeStore from '../store/nodeStore';
import ConnectionComponent from './Connection';
import NodeNavigator from './NodeNavigator';

// Calculate distance from center
const distanceFromCenter = position => {
  return Math.sqrt(position[0] * position[0] + position[1] * position[1] + position[2] * position[2]);
};

// Calculate node scale based on distance from center
const getNodeScale = position => {
  if (!position) return 1;
  const distance = distanceFromCenter(position);
  // Scale from 1 at center to 0.6 at outer edges
  return Math.max(0.6, 1 - (distance * 0.03));
};

// A singular node in the 3D space
const Node = memo(({ data, position, onSelect, selected }) => {
  const AnimatedSphere = animated(Sphere);
  const AnimatedText = animated(Text);
  const isHighlighted = useNodeStore(state => data && state.isNodeHighlighted(data.id));
  const anyNodeSelected = useNodeStore(state => state.selectedNodeId !== null);

  // Calculate scale based on distance from center
  const distanceScale = getNodeScale(position);
  
  // Animation for nodes - increase default size for better visibility
  const { scale, color, opacity } = useSpring({
    scale: selected ? 1.5 * distanceScale : 1.2 * distanceScale,
    color: selected ? '#ff9900' : (data?.color || '#ffffff'),
    opacity: !anyNodeSelected || isHighlighted ? 0.9 : 0.2, // Increase base opacity
    config: { tension: 300, friction: 10 }
  });

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onSelect(data);
  }, [data, onSelect]);

  if (!data) return null;

  return (
    <group 
      position={position} 
      onClick={handleClick}
      renderOrder={isHighlighted || !anyNodeSelected ? 1 : 0}
    >
      <AnimatedSphere args={[1.0, 32, 32]} scale={scale}>
        <animated.meshStandardMaterial 
          color={color} 
          transparent 
          opacity={opacity} 
          emissive={color}
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </AnimatedSphere>
      <AnimatedText
        position={[0, -1.5 * distanceScale, 0]}
        fontSize={0.3 * distanceScale}
        color={isHighlighted || !anyNodeSelected ? "#ffffff" : "#aaaaaa"}
        anchorX="center"
        anchorY="middle"
        opacity={opacity}
      >
        {data.name}
      </AnimatedText>
    </group>
  );
});

// Controls for rotating and time slider
const Controls = memo(({ target, setCameraRef }) => {
  const { camera, controls } = useThree();
  const controlsRef = useRef();
  const clearSelection = useNodeStore(state => state.clearSelection);
  const selectedNodeId = useNodeStore(state => state.selectedNodeId);
  const [isDragging, setIsDragging] = useState(false);
  
  // Update controls target when target changes
  useEffect(() => {
    if (controlsRef.current && target) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  }, [target]);
  
  // Store camera reference for external use
  useEffect(() => {
    if (camera && setCameraRef) {
      setCameraRef(camera);
    }
  }, [camera, setCameraRef]);
  
  useEffect(() => {
    // Initial camera position - move much further back to see the wider node network
    camera.position.set(0, 20, 60);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  
  // Handle background click to clear selection
  const handleBackgroundClick = useCallback((e) => {
    // Only clear selection on direct click (not when ending camera movement)
    if (!isDragging && selectedNodeId !== null) {
      clearSelection();
    }
  }, [isDragging, selectedNodeId, clearSelection]);
  
  const handlePointerDown = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handlePointerMove = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  return (
    <group 
      onClick={handleBackgroundClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        minDistance={8}
        maxDistance={150}
        enableDamping
        dampingFactor={0.1}
      />
      
      {/* Invisible background sphere for click handling */}
      <Sphere args={[150, 64, 64]} position={[0, 0, 0]} visible={false}>
        <meshBasicMaterial side={THREE.BackSide} transparent opacity={0} />
      </Sphere>
    </group>
  );
});

// Container for node network
const NodeNetwork = memo(({ onNodeSelect, currentTarget, updateCamera }) => {
  const nodes = useNodeStore(state => state.nodes);
  const connections = useNodeStore(state => state.connections);
  const selectedNodeId = useNodeStore(state => state.selectedNodeId);

  // Early return if data isn't loaded yet
  if (!nodes || !nodes.length) {
    return null;
  }
  
  if (!connections || !Array.isArray(connections)) {
    return (
      <group>
        {/* Render just nodes if connections are missing */}
        {nodes.map((node) => (
          <Node 
            key={node.id}
            data={node}
            position={node.position || [0, 0, 0]}
            onSelect={(data) => {
              onNodeSelect(data);
            }}
            selected={node.id === selectedNodeId}
          />
        ))}
      </group>
    );
  }
  
  return (
    <group>
      {/* Render all connections */}
      {connections.map((connection, index) => {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);
        if (sourceNode && targetNode) {
          return (
            <ConnectionComponent 
              key={`connection-${index}`}
              start={sourceNode.position}
              end={targetNode.position}
              type={connection.type || 'strong'}
              source={connection.source}
              target={connection.target}
              onNavigate={(nodeId) => {
                const node = nodes.find(n => n.id === nodeId);
                if (node) {
                  onNodeSelect(node);
                }
              }}
            />
          );
        }
        return null;
      })}
      
      {/* Render all nodes */}
      {nodes.map((node) => (
        <Node 
          key={node.id}
          data={node}
          position={node.position || [0, 0, 0]}
          onSelect={(data) => {
            onNodeSelect(data);
          }}
          selected={node.id === selectedNodeId}
        />
      ))}
      
      {/* Render navigation arrows */}
      <NodeNavigator 
        nodes={nodes}
        connections={connections}
        updateCamera={updateCamera}
      />
    </group>
  );
});

// Main component
const OrbView = ({ onNodeSelect, searchQuery }) => {
  const initializeStore = useNodeStore(state => state.initializeStore);
  const selectNode = useNodeStore(state => state.selectNode);
  const nodes = useNodeStore(state => state.nodes);
  const connections = useNodeStore(state => state.connections);
  const [cameraTarget, setCameraTarget] = useState([0, 0, 0]);
  const cameraRef = useRef();
  
  // Initialize store with seed nodes
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);
  
  // Advanced camera positioning function - can position behind nodes
  const updateCamera = useCallback((node, positionBehind = false, customSettings = null) => {
    if (!node || !node.position) return;
    
    // Set the target (what the camera looks at)
    setCameraTarget(node.position);
    
    if (cameraRef.current) {
      const camera = cameraRef.current;
      
      // Get the node position
      const nodePos = new THREE.Vector3(...node.position);
      
      // If custom camera settings are provided, use them
      if (customSettings) {
        const newCameraPos = new THREE.Vector3().fromArray(customSettings.position);
        const lookAtPos = customSettings.lookAt ? new THREE.Vector3().fromArray(customSettings.lookAt) : nodePos;
        
        // Set camera position with animation
        const duration = 800; // ms
        const startPos = new THREE.Vector3().copy(camera.position);
        const startTime = Date.now();
        
        const animateCamera = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease function (quadratic out)
          const t = progress * (2 - progress);
          
          camera.position.lerpVectors(startPos, newCameraPos, t);
          
          // Update lookAt during animation
          camera.lookAt(lookAtPos);
          
          if (progress < 1) {
            requestAnimationFrame(animateCamera);
          }
        };
        
        animateCamera();
        return;
      }
      
      // Calculate direction to center (for orientation)
      const centerDir = new THREE.Vector3();
      centerDir.subVectors(new THREE.Vector3(0, 0, 0), nodePos).normalize();
      
      // Calculate position of the camera
      let cameraOffset;
      let newCameraPos;
      
      if (positionBehind) {
        // Position camera behind the node (looking toward center)
        cameraOffset = new THREE.Vector3().copy(centerDir).multiplyScalar(10);
        newCameraPos = new THREE.Vector3().copy(nodePos).add(cameraOffset);
      } else {
        // Position camera in front of the node (node between camera and center)
        cameraOffset = new THREE.Vector3().copy(centerDir).multiplyScalar(-10);
        newCameraPos = new THREE.Vector3().copy(nodePos).add(cameraOffset);
      }
      
      // Add slight height offset for better visibility
      newCameraPos.y += 3;
      
      // Set camera position with animation
      const duration = 800; // ms
      const startPos = new THREE.Vector3().copy(camera.position);
      const startTime = Date.now();
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease function (quadratic out)
        const t = progress * (2 - progress);
        
        camera.position.lerpVectors(startPos, newCameraPos, t);
        
        // Always look at the node during animation
        camera.lookAt(nodePos);
        
        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        }
      };
      
      animateCamera();
    }
  }, [cameraRef]);
  
  // Handle node selection
  const handleNodeSelect = useCallback((node) => {
    if (!node) return;
    
    // Select the node in the store
    selectNode(node.id);
    
    // Update camera to focus on the selected node
    // Position the camera such that the node is at the front of the view
    // with the orb (center) behind it
    if (node.position) {
      const nodePos = new THREE.Vector3(...node.position);
      const centerDir = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), nodePos).normalize();
      
      // Position camera to look through the node toward the center
      const cameraOffset = centerDir.clone().multiplyScalar(-10); // 10 units behind the node
      const cameraPos = nodePos.clone().add(cameraOffset);
      
      // Add slight height for better perspective
      cameraPos.y += 3;
      
      // Point to look at is toward the center beyond the node
      const lookAtOffset = centerDir.clone().multiplyScalar(10);
      const lookAtPos = nodePos.clone().add(lookAtOffset);
      
      updateCamera(node, false, {
        position: cameraPos.toArray(),
        lookAt: lookAtPos.toArray()
      });
    } else {
      // Fallback if node has no position
      updateCamera(node);
    }
    
    if (onNodeSelect) onNodeSelect(node);
  }, [selectNode, onNodeSelect, updateCamera]);
  
  // Search functionality - highlight matching nodes
  useEffect(() => {
    if (!searchQuery || !nodes || nodes.length === 0) return;
    
    // Simple search implementation
    const matchedNode = nodes.find(
      node => node.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (matchedNode) {
      selectNode(matchedNode.id);
      if (onNodeSelect) onNodeSelect(matchedNode);
      // Center camera on matched node
      updateCamera(matchedNode);
    }
  }, [searchQuery, nodes, onNodeSelect, selectNode, updateCamera]);

  return (
    <Canvas className="w-full h-full">
      <ambientLight intensity={1.0} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#5588ff" />
      <directionalLight position={[0, 5, 5]} intensity={0.5} />
      
      <Controls target={cameraTarget} setCameraRef={(cam) => cameraRef.current = cam} />
      
      <NodeNetwork 
        onNodeSelect={handleNodeSelect} 
        currentTarget={cameraTarget}
        updateCamera={updateCamera}
      />
      
      {/* Background sphere */}
      <Sphere args={[150, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#000020" side={THREE.BackSide} />
      </Sphere>
    </Canvas>
  );
};

export default memo(OrbView);