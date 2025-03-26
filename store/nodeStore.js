import { create } from 'zustand';

// Sample seed data
const seedNodes = [
  { id: 'node1', name: 'Core Concept', position: [0, 0, 0], color: '#ff9900' },
  { id: 'node2', name: 'Abstract Idea', position: [-8, 5, -5], color: '#44aaff' },
  { id: 'node3', name: 'Practical Application', position: [10, -3, -8], color: '#44cc88' },
  { id: 'node4', name: 'Related Theory', position: [-5, -8, 12], color: '#aa44ff' },
  { id: 'node5', name: 'Implementation', position: [15, 2, 8], color: '#ff5544' },
  { id: 'node6', name: 'Future Direction', position: [5, 12, 5], color: '#ffdd44' },
];

const seedConnections = [
  { source: 'node1', target: 'node2', type: 'strong' },
  { source: 'node1', target: 'node3', type: 'strong' },
  { source: 'node1', target: 'node4', type: 'weak' },
  { source: 'node2', target: 'node6', type: 'weak' },
  { source: 'node3', target: 'node5', type: 'strong' },
  { source: 'node4', target: 'node2', type: 'weak' },
  { source: 'node5', target: 'node6', type: 'weak' },
];

const useNodeStore = create((set, get) => ({
  // State
  nodes: [],
  connections: [],
  selectedNodeId: null,
  navigationHistory: [],
  highlightedNodeIds: [],
  highlightedConnections: [],
  
  // Initialize with seed data
  initializeStore: () => {
    set({
      nodes: seedNodes,
      connections: seedConnections,
      selectedNodeId: null,
      navigationHistory: [],
    });
  },
  
  // Node selection
  selectNode: (nodeId) => {
    // Add to navigation history
    const currentHistory = get().navigationHistory || [];
    const updatedHistory = [...currentHistory];
    
    // If selecting the same node twice, don't add to history
    if (updatedHistory[updatedHistory.length - 1] !== nodeId) {
      updatedHistory.push(nodeId);
    }
    
    // Keep only the last 10 visited nodes
    if (updatedHistory.length > 10) {
      updatedHistory.shift();
    }
    
    set({
      selectedNodeId: nodeId,
      navigationHistory: updatedHistory,
    });
  },
  
  // Clear selection
  clearSelection: () => {
    set({
      selectedNodeId: null,
    });
  },
  
  // Check if node is highlighted (connected to selected node)
  isNodeHighlighted: (nodeId) => {
    const state = get();
    const { selectedNodeId, connections } = state;
    
    if (!selectedNodeId) return false;
    if (nodeId === selectedNodeId) return true;
    
    return connections.some(conn => 
      (conn.source === selectedNodeId && conn.target === nodeId) ||
      (conn.target === selectedNodeId && conn.source === nodeId)
    );
  },
  
  // Check if connection is highlighted (connected to selected node)
  isConnectionHighlighted: (source, target) => {
    const state = get();
    const { selectedNodeId } = state;
    
    if (!selectedNodeId) return false;
    
    return (
      source === selectedNodeId || 
      target === selectedNodeId
    );
  },
  
  // Check if connection is downstream of selected node
  isDownstreamConnection: (source, target) => {
    const state = get();
    const { selectedNodeId } = state;
    
    if (!selectedNodeId) return false;
    
    return source === selectedNodeId;
  },
}));

export default useNodeStore;