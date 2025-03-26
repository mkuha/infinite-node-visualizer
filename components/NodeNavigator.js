import { memo, useCallback, useMemo, useEffect } from 'react';
import useNodeStore from '../store/nodeStore';
import * as THREE from 'three';

// Node Navigator - provides camera positioning when a node is selected
const NodeNavigator = memo(({ nodes, connections, updateCamera }) => {
  // All hooks must be called at the top level, before any conditional returns
  const selectedNodeId = useNodeStore(state => state.selectedNodeId);
  const selectNode = useNodeStore(state => state.selectNode);
  const previousNodeId = useNodeStore(state => 
    state.navigationHistory.length > 1 
      ? state.navigationHistory[state.navigationHistory.length - 2] 
      : null
  );

  const findNodeById = useCallback((nodeId) => {
    return nodes.find(n => n.id === nodeId);
  }, [nodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return findNodeById(selectedNodeId);
  }, [selectedNodeId, findNodeById]);

  // Calculate the direction from selected node to center (where downstream nodes are)
  const centerDirection = useMemo(() => {
    if (!selectedNode?.position) return [0, 0, 1];
    
    // Calculate center point of all downstream nodes
    const downstreamNodes = connections
      .filter(conn => conn.source === selectedNodeId)
      .map(conn => findNodeById(conn.target))
      .filter(node => node?.position);
    
    if (downstreamNodes.length > 0) {
      // Calculate average position of downstream nodes
      const center = downstreamNodes.reduce((acc, node) => {
        acc.x += node.position[0];
        acc.y += node.position[1];
        acc.z += node.position[2];
        return acc;
      }, new THREE.Vector3(0, 0, 0));
      
      center.divideScalar(downstreamNodes.length);
      
      // Get direction from selected node to center
      const nodePos = new THREE.Vector3(...selectedNode.position);
      return new THREE.Vector3().subVectors(center, nodePos).normalize().toArray();
    }
    
    // If no downstream nodes, use direction to origin
    const nodePos = new THREE.Vector3(...selectedNode.position);
    return new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), nodePos).normalize().toArray();
  }, [selectedNode, connections, selectedNodeId, findNodeById]);

  // Position camera and handle navigation
  const positionCamera = useCallback((targetNode, lookDirection) => {
    if (!targetNode?.position || !updateCamera) return;

    const nodePos = new THREE.Vector3(...targetNode.position);
    const direction = new THREE.Vector3().fromArray(lookDirection);
    
    // Position camera 8 units behind the node relative to look direction
    const cameraOffset = direction.multiplyScalar(-8);
    const cameraPos = nodePos.clone().add(cameraOffset);
    
    // Look at a point slightly forward from the node to see more of the downstream graph
    const lookAtPos = nodePos.clone().add(direction.normalize().multiplyScalar(10));
    
    updateCamera(targetNode, false, {
      position: cameraPos.toArray(),
      lookAt: lookAtPos.toArray()
    });
  }, [updateCamera]);

  // Initial camera positioning on node selection
  useEffect(() => {
    if (selectedNode) {
      positionCamera(selectedNode, centerDirection);
    }
  }, [selectedNode, positionCamera, centerDirection]);

  // We don't render anything visible - this is just for camera positioning
  return null;
});

export default NodeNavigator;