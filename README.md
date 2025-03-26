# Infinite Node Visualizer

A React-based 3D visualization of interconnected nodes with intuitive navigation and interaction capabilities. This application creates an immersive environment for exploring node networks with smooth camera transitions and clear visual cues.

## Features

- **3D Node Network Visualization** - Interactive spherical nodes in a three-dimensional space
- **Connection-Based Navigation** - Click on connection labels to move between nodes
- **Intelligent Camera Positioning** - Camera automatically positions for optimal viewing angles
- **Visual Highlighting** - Clear highlighting of selected nodes and their connections
- **Responsive Scaling** - Nodes scale based on distance from center for better depth perception
- **Smooth Transitions** - Animated camera movements between nodes

## Technology Stack

- **React** - UI component framework
- **Next.js** - React framework for server-side rendering and routing
- **Three.js** - 3D rendering library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for React Three Fiber
- **Zustand** - State management for React
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mkuha/infinite-node-visualizer.git
   cd infinite-node-visualizer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Node Interaction

- **Click on a node** to select it and position the camera for optimal viewing
- **Click on a connection label** to navigate to the connected node
- **Click the background** to deselect any nodes and return to the overview

### Navigation

The visualization offers intuitive navigation through connected nodes:
- Labels on connection lines show the name of connected nodes
- Clicking a label navigates to that node
- The camera automatically positions to show the selected node and its connections

## Project Structure

```
infinite-node/
├── components/       # React components
│   ├── Connection.js       # Connection visualization between nodes
│   ├── NodeNavigator.js    # Camera positioning logic
│   ├── OrbView.js          # Main 3D visualization component
├── pages/            # Next.js pages
├── store/            # Zustand state management
│   ├── nodeStore.js        # Node data and selection state
├── styles/           # CSS stylesheets
├── utils/            # Utility functions
├── public/           # Static assets
```

## Customization

### Node Data

The node network data is managed in the `nodeStore.js` file. You can customize:

- Node positions in 3D space
- Node names and colors
- Connection types and strengths

### Visual Styling

Visual aspects like colors, sizes, and animations can be adjusted in the respective component files:

- `Node.js` - For node appearance
- `Connection.js` - For connection line styling
- `OrbView.js` - For global visual settings

## License

MIT License