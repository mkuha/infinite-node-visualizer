import { useState } from 'react';
import OrbView from '../components/OrbView';

export default function Home() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Infinite Node Visualizer</h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search nodes..."
                className="px-4 py-2 bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Search is handled by the OrbView component
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow relative">
        <div className="absolute inset-0">
          <OrbView 
            onNodeSelect={setSelectedNode}
            searchQuery={searchQuery}
          />
        </div>
      </main>
      
      <footer className="p-3 border-t border-gray-800 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <div>
            {selectedNode ? (
              <span>Selected: {selectedNode.name}</span>
            ) : (
              <span>No node selected</span>
            )}
          </div>
          <div>
            <span>Use mouse to rotate view. Click nodes to navigate.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}