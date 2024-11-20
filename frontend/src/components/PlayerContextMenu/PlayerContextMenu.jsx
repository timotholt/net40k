import PropTypes from 'react';
import { GameIcon, WhisperIcon, FriendIcon, MuteIcon, ReportIcon, BlockIcon } from '../Icons/MenuIcons';

export function createPlayerContextMenuItems(userUuid, onAction = () => {}) {
  return [
    {
      label: 'Invite to game',
      icon: <GameIcon />,
      onClick: () => onAction('invite', userUuid)
    },
    {
      label: 'Whisper',
      icon: <WhisperIcon />,
      onClick: () => onAction('whisper', userUuid)
    },
    {
      label: 'Add friend',
      icon: <FriendIcon />,
      onClick: () => onAction('friend', userUuid)
    },
    { type: 'separator' },
    {
      label: 'More...',
      items: [
        {
          label: 'Mute',
          icon: <MuteIcon />,
          onClick: () => onAction('mute', userUuid)
        },
        {
          label: 'Report',
          icon: <ReportIcon />,
          onClick: () => onAction('report', userUuid)
        },
        {
          label: 'Block',
          icon: <BlockIcon />,
          onClick: () => onAction('block', userUuid)
        }
      ]
    }
  ];
}