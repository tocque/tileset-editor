import DrawingBoard from './DrawingBoard';
import ReferenceList from './ReferenceList';
import Toolbar from './Toolbar';
import Topbar from './Topbar';
import styles from './index.module.less';

function App() {
  return (
    <>
      <div className={styles.topbar}>
        <Topbar />
      </div>
      <div className={styles.main}>
        <div className={styles.leftSection}>
          <DrawingBoard />
        </div>
        <div className={styles.centerSection}>
          <Toolbar />
        </div>
        <div className={styles.rightSection}>
          <ReferenceList />
        </div>
      </div>
    </>
  );
}

export default App;
