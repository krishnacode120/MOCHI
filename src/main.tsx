import React from 'react';
import ReactDOM from 'react-dom/client';
import { Settings } from './components/Settings/Settings';
import { ContextMenu } from './components/ContextMenu/ContextMenu';
import { Reminder } from './components/Reminder/Reminder';
import { connect, native, reportError, command } from './services/native';
import { usePetStore } from './stores/settings';
import './themes/cozy.css';
const PetRenderer = React.lazy(() => import('./components/PetRenderer/PetRenderer').then(module => ({ default: module.PetRenderer })));
const view = new URLSearchParams(location.search).get('view');
document.documentElement.className = view === 'pet' ? 'pet-window' : view === 'menu' ? 'menu-window' : view === 'reminder' ? 'reminder-window' : 'settings-window';
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(e: unknown) { reportError(e); }
  render() { return this.state.error ? <div className="fatal">Mochi couldn’t start. Please reopen the app from the tray.<button onClick={() => location.reload()}>Try again</button><button onClick={() => void command('quit')}>Exit</button></div> : this.props.children; }
}
function App() {
  const ready = usePetStore(s => s.ready), error = usePetStore(s => s.error);
  return <ErrorBoundary><React.Suspense fallback={null}>{ready && (view === 'pet' && native ? <PetRenderer/> : view === 'menu' ? <ContextMenu/> : view === 'reminder' ? <Reminder/> : <Settings/>)}</React.Suspense>{error && view !== 'pet' && <div role="alert" className="error-toast">{error}<button aria-label="Dismiss error" onClick={() => usePetStore.setState({ error: null })}>×</button></div>}</ErrorBoundary>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<App/>);
connect().then(unsubscribe => { window.addEventListener('beforeunload', unsubscribe, { once: true }); }).catch(reportError);
