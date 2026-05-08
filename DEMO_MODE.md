# Demo Mode - Vercel Deployment Guide

## Overview
This project now includes a **Demo Mode** that allows you to showcase the agent tracking dashboard on Vercel without needing to run a backend server. The app automatically detects when it's deployed to production and switches to demo mode, displaying realistic mock data and simulating live agent activity.

## How It Works

### Automatic Detection
When deployed to Vercel (or any production environment):
- **Demo mode activates automatically** in production builds (`import.meta.env.PROD === true`)
- The app attempts to connect to the real backend first if available
- If the backend connection fails, it gracefully falls back to demo mode
- In development, the app tries to connect to `localhost:4000` (your local backend)

### What's Included in Demo Mode

#### 3 Pre-configured Agents
- **Email Manager** (running, 92% trust score)
- **Calendar Assistant** (running, 87% trust score)  
- **Research Bot** (idle, 95% trust score)

#### Sample Actions
- 5 detailed agent actions with full decision traces
- Real reasoning, confidence scores, and status information
- Mix of completed, pending, and failed actions

#### Rules & Governance
- 4 pre-configured rules per agent
- Full rule creation, toggle, and delete functionality

#### Live Simulation
- New actions are generated and added to the timeline every 4-8 seconds
- Agent trust scores update dynamically
- Realistic action types and descriptions

## Features Available in Demo Mode

All dashboard features work fully in demo mode:

### ✅ Functional Controls
- **Pause/Resume Agents** - Toggle agent status in real-time
- **Approve/Reject Actions** - Mark actions as approved or rejected
- **Re-run Actions** - Correct action output
- **Retry Failed Actions** - Simulate retry behavior
- **Fallback Options** - Escalate actions to manual queue
- **Redirect Agent** - Send new instructions to agents

### ✅ Rules Management
- **Create Rules** - Add new governance rules
- **Toggle Rules** - Enable/disable rules on the fly
- **Delete Rules** - Remove rules

### ✅ Dashboard Features
- **Action Timeline** - View all agent actions
- **Search & Filter** - Find actions by description, reasoning, or type
- **Decision Inspector** - Inspect full decision trace with reasoning
- **Trust Scores** - Monitor agent reliability
- **Connection Status** - Visual indicator of connection state

## Deployment to Vercel

### 1. Build the Project
```bash
npm run build
```

The built files in the `dist/` folder are ready to deploy.

### 2. Deploy to Vercel
```bash
# Using Vercel CLI
npm install -g vercel
vercel

# Or use GitHub integration
# Connect your repository to Vercel for automatic deployments
```

### 3. No Environment Variables Needed
Demo mode works out of the box! You don't need to configure any backend URLs.

## Development with Real Backend

### Run Both Frontend and Backend
```bash
# Terminal 1: Backend (from server/ directory)
cd server
npm install
npm run dev

# Terminal 2: Frontend
npm run dev
```

The app will automatically connect to the backend at `http://localhost:4000`.

### Override Backend URL
Set the `VITE_BACKEND_URL` environment variable:
```bash
VITE_BACKEND_URL=https://your-backend.com npm run build
```

## Architecture

### File Structure
```
src/
├── services/
│   ├── mockData.ts      # Sample agents, actions, rules
│   └── mockSocket.ts    # Mock Socket.io implementation
├── hooks/
│   └── useAgentSocket.ts # Socket connection with fallback
└── components/
    ├── NewDecisionInspector.tsx
    ├── RulesPanel.tsx
    └── ... other components
```

### MockSocket Implementation
- Custom `SimpleEventEmitter` class for browser compatibility
- Fully simulates Socket.io event patterns
- Handles all client->server events:
  - Agent control (pause, resume, redirect)
  - Action management (approve, reject, rerun, retry, fallback)
  - Rule management (create, toggle, delete)
- Generates realistic demo actions continuously

## Testing the Demo

### Access the Live Demo
Visit your Vercel deployment URL and:

1. **Login** with any username (demo auth accepts all inputs)
2. **View the Dashboard**
   - 3 agents in the left sidebar
   - Recent actions in the center timeline
   - Selected action details on the right

3. **Try Interactive Features**
   - Click an action to inspect its decision trace
   - Click "Pause Agent" to pause an agent
   - Click "Approve/Reject" to approve or reject actions
   - Create a new rule by selecting an agent and filling in the rule form

4. **Watch Live Updates**
   - New actions appear in the timeline every 4-8 seconds
   - Agent trust scores change dynamically
   - Status indicators update in real-time

## Performance Notes

- **Bundle Size**: Minimal impact (~2KB additional code)
- **No Backend Dependency**: Fully client-side, works offline
- **Real-time Simulation**: Uses setInterval for action generation
- **Graceful Fallback**: Seamlessly switches from backend to demo mode

## Troubleshooting

### Demo Mode Not Activating
- Check that you're running a **production build**: `npm run build`
- Verify that `import.meta.env.PROD === true` in browser console

### Want to Force Demo Mode in Development
Update `useAgentSocket.ts`:
```typescript
// Force demo mode for testing
useMockRef.current = true;
```

### Custom Demo Data
Edit `mockData.ts` to customize:
- Agent names and initial states
- Sample actions and their details
- Default rules

## Future Enhancements

Ideas for extending demo mode:
- [ ] Persistent demo state in localStorage
- [ ] Custom demo scenarios
- [ ] Recording and playback of real agent behavior
- [ ] Performance benchmarking mode
- [ ] Stress testing with configurable action frequency

## Support

For issues or questions about demo mode, check:
1. Browser console for error messages
2. Network tab to verify backend connection attempts
3. `[Socket]` logs to see connection lifecycle
