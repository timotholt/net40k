import { useZoom } from '../../context/ZoomContext';
import styles from './ZoomControls.module.css';

function ZoomControls() {
  const { setZoom } = useZoom();

  const handleZoom = (delta, e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(delta);
  };

  return (
    <div 
      className={styles.controls}
      onMouseEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        onClick={(e) => handleZoom(-0.1, e)}
        className={styles.zoomButton}
        title="Zoom Out"
      >
        −
      </button>
      <button
        onClick={(e) => handleZoom(0.1, e)}
        className={styles.zoomButton}
        title="Zoom In"
      >
        +
      </button>
    </div>
  );
}

export default ZoomControls;