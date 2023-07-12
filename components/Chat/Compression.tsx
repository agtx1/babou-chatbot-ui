import { FC, useContext, useState } from 'react';
import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

interface Props {
  label: string;
  onToggleCompression: (isEnabled: boolean) => void;
}

export const CompressionToggle: FC<Props> = ({
  label,
  onToggleCompression,
}) => {
  const {
    state: { conversations },
  } = useContext(HomeContext);
  const lastConversation = conversations[conversations.length - 1];
  const [isEnabled, setIsEnabled] = useState(
    lastConversation?.compressionEnabled ?? false,
  );
  const { t } = useTranslation('chat');

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value === 'enabled';
    setIsEnabled(newValue);
    onToggleCompression(newValue);
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">{label}</label>
      <span className="text-[12px] text-black/50 dark:text-white/50 text-sm">{t('Conversation compression allows ChatGPT to remember more in a single conversation by compressing previous messages. Compression is not good for non-English text or code.')}</span>
      <div className="mt-2">
        <input
          type="radio"
          name="compressionToggle"
          value="enabled"
          checked={isEnabled}
          onChange={handleToggle}
        /> Enable
        <input
          type="radio"
          name="compressionToggle"
          value="disabled"
          checked={!isEnabled}
          onChange={handleToggle}
        /> Disable
      </div>
    </div>
  );
};