import { useState, useMemo } from 'react';
import { useFlashcardData } from './hooks/useFlashcardData';
import type { Deck, Grade } from './utils/srs';

type View = 'dashboard' | 'modules' | 'review' | 'analytics' | 'module-detail';
type StudyMode = 'srs' | 'anytime';

export default function App() {
  const { 
    decks, addDeck, deleteDeck, 
    addCard, deleteCard, 
    reviewCard, exportData, importData 
  } = useFlashcardData();

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('srs');

  const selectedDeck = useMemo(() => 
    decks.find(d => d.id === selectedDeckId), [decks, selectedDeckId]
  );

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          importData(data);
        } catch (err) {
          alert('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const navigateToModule = (id: string) => {
    setSelectedDeckId(id);
    setCurrentView('module-detail');
  };

  const startReview = (id: string, mode: StudyMode = 'srs') => {
    setSelectedDeckId(id);
    setStudyMode(mode);
    setCurrentView('review');
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>L</div>
          <span>Lumina</span>
        </div>
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            <span>📊</span> Dashboard
          </div>
          <div className={`nav-item ${currentView === 'modules' || currentView === 'module-detail' ? 'active' : ''}`} onClick={() => setCurrentView('modules')}>
            <span>📚</span> Modules
          </div>
          <div className={`nav-item ${currentView === 'review' ? 'active' : ''}`} onClick={() => setCurrentView('review')}>
            <span>🧠</span> Review Path
          </div>
          <div className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`} onClick={() => setCurrentView('analytics')}>
            <span>📈</span> Analytics
          </div>
        </nav>

        <div className="pro-card card" style={{ background: 'var(--sidebar-hover)', border: 'none', color: 'white', padding: '1rem', marginTop: 'auto' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>PRO PLAN</p>
          <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--sidebar-text)' }}>Unlock advanced analytics and cloud sync.</p>
          <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem' }}>Upgrade Now</button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="main-workspace">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <span style={{ color: 'var(--text-muted)' }}>Workspace /</span>
            <span style={{ fontWeight: 600 }}>{currentView.charAt(0).toUpperCase() + currentView.slice(1).replace('-', ' ')}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={exportData}>Export</button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              Import
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>JS</div>
          </div>
        </header>

        <main className="content-area">
          {currentView === 'dashboard' && <DashboardView decks={decks} onNavigateModules={() => setCurrentView('modules')} onStartReview={startReview} />}
          {currentView === 'modules' && <ModulesView decks={decks} onAddModule={addDeck} onSelect={navigateToModule} />}
          {currentView === 'module-detail' && selectedDeck && (
             <ModuleDetailView 
              deck={selectedDeck} 
              onBack={() => setCurrentView('modules')}
              onAddCard={(f, b) => addCard(selectedDeck.id, f, b)}
              onDeleteCard={(cid) => deleteCard(selectedDeck.id, cid)}
              onDeleteModule={() => { deleteDeck(selectedDeck.id); setCurrentView('modules'); }}
              onStudy={() => setCurrentView('review')}
             />
          )}
          {currentView === 'review' && (
            <ReviewPathView 
              decks={decks} 
              selectedDeckId={selectedDeckId} 
              mode={studyMode}
              onReview={(did, cid, grade) => reviewCard(did, cid, grade)}
              onFinish={() => setCurrentView('dashboard')}
            />
          )}
          {currentView === 'analytics' && <AnalyticsView decks={decks} />}
        </main>
      </div>
    </div>
  );
}

function DashboardView({ decks, onNavigateModules, onStartReview }: { decks: Deck[], onNavigateModules: () => void, onStartReview: (id: string, mode: StudyMode) => void }) {
  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);
  const totalDue = decks.reduce((acc, d) => acc + d.cards.filter(c => new Date(c.srs.nextReview) <= new Date()).length, 0);
  const masteringProgress = totalCards ? Math.round((decks.reduce((acc, d) => acc + d.cards.filter(c => c.srs.repetitions >= 5).length, 0) / totalCards) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="pro-banner">
        <div>
          <h2 style={{ margin: '0 0 0.5rem' }}>Welcome back, Scholar!</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>You have {totalDue} items scheduled for review today. Keep your streak alive!</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'white', color: 'var(--primary)' }} onClick={() => onStartReview('', 'srs')}>Start Daily Session</button>
          <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => onStartReview('', 'anytime')}>Quick Session (All)</button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-label">Knowledge Assets</span>
          <span className="stat-value">{totalCards}</span>
          <span className="stat-change up">↑ 12% from last week</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Retention Score</span>
          <span className="stat-value">{masteringProgress}%</span>
          <span className="stat-change up">↑ 2.4% stability</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Pending Reviews</span>
          <span className="stat-value" style={{ color: totalDue > 0 ? 'var(--danger)' : 'var(--success)' }}>{totalDue}</span>
          <span className="stat-change">{totalDue > 0 ? 'Action required' : 'All caught up'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Active Learning Modules</h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={onNavigateModules}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {decks.slice(0, 3).map(deck => {
              const due = deck.cards.filter(c => new Date(c.srs.nextReview) <= new Date()).length;
              return (
                <div key={deck.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{deck.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{deck.cards.length} cards · {due} due</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onStartReview(deck.id, 'srs')}>Review</button>
                </div>
              );
            })}
            {decks.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No active modules. Start by creating one!</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6 }}></div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Completed session</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i * 2} hours ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModulesView({ decks, onAddModule, onSelect }: { decks: Deck[], onAddModule: (n: string, d: string) => void, onSelect: (id: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onAddModule(name, desc);
      setName(''); setDesc(''); setShowAdd(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <h1 style={{ margin: 0 }}>Learning Modules</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Create Module</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>New Module</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <input placeholder="Module Name (e.g., Computer Science 101)" value={name} onChange={e => setName(e.target.value)} required />
            <textarea placeholder="Brief description of the learning objectives..." value={desc} onChange={e => setDesc(e.target.value)} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Create Module</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {decks.map(deck => {
          const dueCount = deck.cards.filter(c => new Date(c.srs.nextReview) <= new Date()).length;
          const mastery = deck.cards.length ? Math.round((deck.cards.filter(c => c.srs.repetitions >= 5).length / deck.cards.length) * 100) : 0;
          
          return (
            <div key={deck.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onSelect(deck.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>📁</div>
                <span className={`badge ${dueCount > 0 ? 'badge-red' : 'badge-green'}`}>
                  {dueCount > 0 ? `${dueCount} Due` : 'Healthy'}
                </span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem' }}>{deck.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem', height: '2.5rem', overflow: 'hidden' }}>{deck.description || 'No description provided.'}</p>
              
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                  <span>Mastery</span>
                  <span>{mastery}%</span>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: `${mastery}%` }}></div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {deck.cards.length} Cards Total
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleDetailView({ deck, onBack, onAddCard, onDeleteCard, onDeleteModule, onStudy }: {
  deck: Deck, onBack: () => void, onAddCard: (f: string, b: string) => void, onDeleteCard: (id: string) => void, onDeleteModule: () => void, onStudy: (mode: StudyMode) => void
}) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (front && back) {
      onAddCard(front, back);
      setFront(''); setBack('');
    }
  };

  return (
    <div className="animate-fade-in">
      <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={onBack}>← Back to Modules</button>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem' }}>{deck.name}</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{deck.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => onStudy('anytime')}>Free Study</button>
            <button className="btn btn-primary" onClick={() => onStudy('srs')}>Start Review Session</button>
            <button className="btn btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => { if(confirm('Delete module?')) onDeleteModule(); }}>Delete</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Create Asset</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Front Surface</label>
              <textarea placeholder="e.g., Define 'Clausius Statement'" value={front} onChange={e => setFront(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Back Surface</label>
              <textarea placeholder="Detailed explanation..." value={back} onChange={e => setBack(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add to Module</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Knowledge Base ({deck.cards.length} items)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {deck.cards.map(card => (
              <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{card.front}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{card.back}</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={() => onDeleteCard(card.id)}>🗑️</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewPathView({ decks, selectedDeckId, mode, onReview, onFinish }: { 
  decks: Deck[], selectedDeckId: string | null, mode: StudyMode, onReview: (did: string, cid: string, grade: Grade) => void, onFinish: () => void 
}) {
  const allCards = useMemo(() => {
    if (selectedDeckId) {
      const d = decks.find(d => d.id === selectedDeckId);
      if (!d) return [];
      
      const due = d.cards.filter(c => new Date(c.srs.nextReview) <= new Date()).map(c => ({ ...c, deckId: d.id }));
      const all = d.cards.map(c => ({ ...c, deckId: d.id }));
      
      if (mode === 'srs') {
        return due.length > 0 ? due : all; // Fallback to all if none due
      }
      return all;
    }
    
    // Global review
    const allDue = decks.flatMap(d => d.cards.filter(c => new Date(c.srs.nextReview) <= new Date()).map(c => ({ ...c, deckId: d.id })));
    const everything = decks.flatMap(d => d.cards.map(c => ({ ...c, deckId: d.id })));
    
    if (mode === 'srs') {
      return allDue.length > 0 ? allDue : everything;
    }
    return everything;
  }, [decks, selectedDeckId, mode]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = allCards[currentIndex];

  const handleReview = (grade: Grade) => {
    onReview(currentCard.deckId, currentCard.id, grade);
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < allCards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Instead of finishing, just stay on the last card or reset
        setCurrentIndex(0);
      }
    }, 150);
  };

  if (allCards.length === 0) {
    return (
      <div className="card" style={{ padding: '4rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
        <h2>Module is Empty</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Add some cards to this module to start practicing!</p>
        <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={onFinish}>Return to Dashboard</button>
      </div>
    );
  }

  const isActuallyDue = new Date(currentCard.srs.nextReview) <= new Date();

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ margin: 0 }}>Practice Session</h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Continuous accessibility mode enabled.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={`badge ${isActuallyDue ? 'badge-red' : 'badge-blue'}`}>
            {isActuallyDue ? 'Scheduled Review' : 'Extra Practice'}
          </span>
          <span className="badge badge-blue">Item {currentIndex + 1} of {allCards.length}</span>
          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={onFinish}>Exit</button>
        </div>
      </div>

      <div className="flashcard-wrapper" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="card-face">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2rem' }}>Prompt</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 600 }}>{currentCard.front}</div>
          </div>
          <div className="card-face card-face-back">
            <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', marginBottom: '2rem' }}>Resolution</span>
            <div style={{ fontSize: '1.5rem' }}>{currentCard.back}</div>
          </div>
        </div>
      </div>

      <div style={{ height: '8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {!isFlipped ? (
          <p style={{ color: 'var(--text-muted)' }}>Click card to reveal resolution</p>
        ) : (
          <div className="animate-fade-in">
             <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>How accurately did you recall this?</p>
             <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={(e) => { e.stopPropagation(); handleReview(0); }}>Again</button>
              <button className="btn" style={{ background: '#f59e0b', color: 'white' }} onClick={(e) => { e.stopPropagation(); handleReview(1); }}>Hard</button>
              <button className="btn" style={{ background: '#10b981', color: 'white' }} onClick={(e) => { e.stopPropagation(); handleReview(2); }}>Good</button>
              <button className="btn" style={{ background: '#4f46e5', color: 'white' }} onClick={(e) => { e.stopPropagation(); handleReview(3); }}>Easy</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsView({ decks }: { decks: Deck[] }) {
  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);
  const mastered = decks.reduce((acc, d) => acc + d.cards.filter(c => c.srs.repetitions >= 5).length, 0);
  const learning = totalCards - mastered;

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '2rem' }}>Performance Analytics</h1>
      
      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-label">Retention Rate</span>
          <span className="stat-value">94.2%</span>
          <span className="stat-change up">↑ 0.8% efficiency</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Knowledge Stability</span>
          <span className="stat-value">18.4 days</span>
          <span className="stat-change up">↑ 2.1 days avg interval</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Learning Velocity</span>
          <span className="stat-value">4.2 cards/day</span>
          <span className="stat-change down">↓ 0.5 from last week</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="section-title">Knowledge Distribution</h3>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Mastered Assets</span>
              <span style={{ fontWeight: 600 }}>{mastered}</span>
            </div>
            <div className="progress-bg"><div className="progress-fill" style={{ width: `${(mastered/totalCards)*100}%`, background: 'var(--success)' }}></div></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Learning Phase</span>
              <span style={{ fontWeight: 600 }}>{learning}</span>
            </div>
            <div className="progress-bg"><div className="progress-fill" style={{ width: `${(learning/totalCards)*100}%`, background: 'var(--warning)' }}></div></div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>[ Advanced charts available in Lumina Pro ]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
