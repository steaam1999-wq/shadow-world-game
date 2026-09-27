import { NavBar } from './components/NavBar';
import { LevelUpOverlay, SettingsModal, Toasts } from './components/Overlays';
import { Particles } from './components/Particles';
import { TopBar } from './components/TopBar';
import { useGame } from './hooks/useGame';
import { AchievementsPage } from './pages/AchievementsPage';
import { ArenaPage } from './pages/ArenaPage';
import { BattlePage } from './pages/BattlePage';
import { CombatScreen } from './pages/CombatScreen';
import { CreateHero } from './pages/CreateHero';
import { HeroPage } from './pages/HeroPage';
import { InventoryPage } from './pages/InventoryPage';
import { QuestsPage } from './pages/QuestsPage';
import { ShadowsPage } from './pages/ShadowsPage';
import { TowerPage } from './pages/TowerPage';

const PAGES = {
  battle: BattlePage,
  arena: ArenaPage,
  tower: TowerPage,
  hero: HeroPage,
  inventory: InventoryPage,
  shadows: ShadowsPage,
  quests: QuestsPage,
  achievements: AchievementsPage,
};

export default function App() {
  const { state, page, battle } = useGame();

  if (!state.hero) {
    return (
      <>
        <Particles />
        <CreateHero />
        <Toasts />
      </>
    );
  }

  const Page = PAGES[page];
  return (
    <>
      <Particles />
      <NavBar />
      <div className="relative z-10 lg:pl-24">
        <TopBar />
        <main key={page} className="anim-fade-in mx-auto max-w-7xl px-3 pb-28 pt-4 sm:px-5 lg:pb-10">
          <Page />
        </main>
      </div>
      {battle && <CombatScreen key={battle.key} battle={battle} />}
      <SettingsModal />
      <LevelUpOverlay />
      <Toasts />
    </>
  );
}
