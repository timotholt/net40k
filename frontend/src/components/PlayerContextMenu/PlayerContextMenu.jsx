import PropTypes from 'react';
import { GameIcon, WhisperIcon, FriendIcon, MuteIcon, ReportIcon, BlockIcon } from '../Icons/MenuIcons';

export function createPlayerContextMenuItems(playerId, onAction = () => {}) {
  return [
    {
      label: 'Invite to game',
      icon: <GameIcon />,
      onClick: () => onAction('invite', playerId)
    },
    {
      label: 'Whisper',
      icon: <WhisperIcon />,
      onClick: () => onAction('whisper', playerId)
    },
    {
      label: 'Add friend',
      icon: <FriendIcon />,
      onClick: () => onAction('friend', playerId)
    },
    { type: 'separator' },
    {
      label: 'More...',
      items: [
        {
          label: 'Mute',
          icon: <MuteIcon />,
          onClick: () => onAction('mute', playerId)
        },
        {
          label: 'Report',
          icon: <ReportIcon />,
          onClick: () => onAction('report', playerId)
        },
        {
          label: 'Block',
          icon: <BlockIcon />,
          onClick: () => onAction('block', playerId)
        }
      ]
    }
  ];
}