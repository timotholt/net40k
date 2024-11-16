import PropTypes from 'prop-types';
import styles from './EmptyState.module.css';

export default function EmptyState({ message }) {
  // Replace <ESC> with styled span
  const formattedMessage = message.split('<ESC>').map((part, index, array) => {
    if (index === array.length - 1) return <span key={index}>{part}</span>;
    return (
      <span key={index}>
        {part}
        <span className={styles.keyHint}>ESC</span>
      </span>
    );
  });

  return (
    <div className={styles.emptyState}>
      {formattedMessage}
    </div>
  );
}

EmptyState.propTypes = {
  message: PropTypes.string.isRequired
};