import TextWithContextMenu from '../TextWithContextMenu/TextWithContextMenu';
import { createPlayerContextMenuItems } from '../PlayerContextMenu/PlayerContextMenu';
import styles from './ContextMenuTest.module.css';

export default function ContextMenuTest() {
  const handlePlayerAction = (action, playerId) => {
    console.log(`Test: ${action} for player ${playerId}`);
  };

  return (
    <div className={styles.testButton}>
      <TextWithContextMenu
        text="📋"
        contextMenuItems={createPlayerContextMenuItems('TEST_USER', handlePlayerAction)}
        className={styles.buttonText}
      />
    </div>
  );
}