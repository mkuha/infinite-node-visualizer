import { useRef, useMemo, useCallback, memo } from 'react';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import useNodeStore from '../store/nodeStore';

// Connection lines between nodes
const Connection = memo(({ start, end, type, source, target, onNavigate }) => {
  const ref = useRef();
  
  const isHighlighted = useNodeStore(state => {
    // Ensure both source and target exist before checking
    return source && target && state.isConnectionHighlighted 
      ? state.isConnectionHighlighted(source, target) 
      : false;
  });
  
  const isDownstream = useNodeStore(state => {
    // Ensure both source and target exist before checking
    return source && target && state.isDownstreamConnection 
      ? state.isDownstreamConnection(source, target) 
      : false;
  });
  
  const anyNodeSelected = useNodeStore(state => state.selectedNodeId !== null);
  const selectedNodeId = useNodeStore(state => state.selectedNodeId);
  
  // Determine if this connection is navigable (upstream or downstream from current selection)
  const isNavigableUpstream = selectedNodeId === target;
  const isNavigableDownstream = selectedNodeId === source;
  const isNavigable = isNavigableUpstream || isNavigableDownstream;
  
  // Get node names for labels
  const nodes = useNodeStore(state => state.nodes);
  const sourceNode = useMemo(() => nodes.find(n => n.id === source), [nodes, source]);
  const targetNode = useMemo(() => nodes.find(n => n.id === target), [nodes, target]);
  
  // Calculate visibility
  const visible = !anyNodeSelected || isHighlighted;
  
  // Enhanced colors with glow and navigability indicators
  const baseColor = type === 'strong' ? '#4080ff' : '#40ff80';
  const highlightColor = type === 'strong' ? '#60c0ff' : '#60ffa0';
  const navigationColor = isNavigableUpstream ? '#ffaa00' : isNavigableDownstream ? '#00ffaa' : '';
  
  // Use navigation color when available, otherwise use highlight/base color
  const color = isNavigable ? navigationColor : (isHighlighted ? highlightColor : baseColor);
  
  // Opacity and width are more pronounced
  const opacity = !anyNodeSelected ? 
                 (type === 'strong' ? 0.8 : 0.6) : 
                 (isHighlighted || isNavigable ? (type === 'strong' ? 0.9 : 0.8) : 0.05);
  
  // Much thicker for highlighted connections
  const tubeRadius = !anyNodeSelected ? 
                   (type === 'strong' ? 0.04 : 0.025) :
                   (isHighlighted || isNavigable ? (type === 'strong' ? 0.08 : 0.05) : 0.01);
  
  // Calculate midpoint with some offset for curve
  const midPoint = useMemo(() => {
    if (!start || !end) return [0, 0, 0];
    
    // Find direction vector
    const direction = [
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2]
    ];
    
    // Calculate perpendicular vector (using cross product with up vector)
    const up = [0, 1, 0];
    const perp = [
      direction[1] * up[2] - direction[2] * up[1],
      direction[2] * up[0] - direction[0] * up[2],
      direction[0] * up[1] - direction[1] * up[0]
    ];
    
    // Normalize perpendicular vector
    const perpLength = Math.sqrt(perp[0]**2 + perp[1]**2 + perp[2]**2);
    if (perpLength === 0) return [(start[0] + end[0])/2, (start[1] + end[1])/2 + 0.5, (start[2] + end[2])/2];
    
    const normPerp = perp.map(v => v / perpLength);
    
    // Calculate midpoint with offset
    const bendAmount = Math.min(1, Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2) * 0.15);
    
    return [
      (start[0] + end[0])/2 + normPerp[0] * bendAmount,
      (start[1] + end[1])/2 + normPerp[1] * bendAmount, 
      (start[2] + end[2])/2 + normPerp[2] * bendAmount
    ];
  }, [start, end]);
  
  // Create curve for tube
  const curve = useMemo(() => {
    if (!start || !end || !midPoint) return null;
    
    const curvePoints = [
      new THREE.Vector3(start[0], start[1], start[2]),
      new THREE.Vector3(midPoint[0], midPoint[1], midPoint[2]),
      new THREE.Vector3(end[0], end[1], end[2])
    ];
    
    // Use quadratic bezier curve for smooth bending
    return new THREE.QuadraticBezierCurve3(
      curvePoints[0],
      curvePoints[1],
      curvePoints[2]
    );
  }, [start, end, midPoint]);
  
  // Calculate label position - exactly at the midpoint of the curve
  const labelPosition = useMemo(() => {
    if (!curve) return [0, 0, 0];
    // Position at the middle of the curve (t=0.5)
    const position = curve.getPoint(0.5);
    return position.toArray();
  }, [curve]);
  
  // Handle navigation when connection is clicked
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    // Navigate to the target node
    if (onNavigate) {
      if (isNavigableUpstream) {
        onNavigate(source); // Navigate to source (upstream)
      } else if (isNavigableDownstream) {
        onNavigate(target); // Navigate to target (downstream)
      }
    }
  }, [onNavigate, source, target, isNavigableUpstream, isNavigableDownstream]);
  
  if (!start || !end || !source || !target || !curve) return null;
  
  // Don't render if not visible (but keep in scene graph)
  if (!visible && !isNavigable && anyNodeSelected) return null;
  
  // Determine label text based on navigation direction
  const getLabelText = () => {
    if (isNavigableUpstream) {
      return `⬅ ${sourceNode?.name || 'upstream'}`;
    } else if (isNavigableDownstream) {
      return `${targetNode?.name || 'downstream'} ➡`;
    } else if (sourceNode && targetNode) {
      return `${sourceNode.name} → ${targetNode.name}`;
    }
    return '';
  };
  
  // Get label background color - highlight when navigable
  const getLabelBackground = () => {
    if (isNavigableUpstream) return 'rgba(255,170,0,0.7)';
    if (isNavigableDownstream) return 'rgba(0,255,170,0.7)';
    return 'rgba(0,0,0,0.7)';
  };
  
  return (
    <group renderOrder={isNavigable ? 3 : (isHighlighted ? 2 : 1)}>
      {/* Curved tube geometry */}
      <mesh onClick={handleClick}>
        <tubeGeometry args={[curve, 20, tubeRadius, 8, false]} />
        <meshStandardMaterial 
          color={color} 
          transparent={true}
          opacity={opacity}
          emissive={color}
          emissiveIntensity={isNavigable ? 0.8 : (isHighlighted ? 0.6 : 0.3)}
        />
      </mesh>
      
      {/* Enhanced connection label - always visible when connection is visible */}
      {(visible || isNavigable) && (
        <Billboard
          position={labelPosition}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <mesh onClick={handleClick} position={[0, 0, 0]}>
            <planeGeometry args={[isNavigable ? 2.5 : 2, 0.4]} />
            <meshBasicMaterial 
              color={getLabelBackground()}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          <Text
            position={[0, 0, 0.01]} 
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
            renderOrder={4}
            onClick={handleClick}
            visible={visible || isNavigable}
          >
            {getLabelText()}
          </Text>
        </Billboard>
      )}
    </group>
  );
});

export default Connection;