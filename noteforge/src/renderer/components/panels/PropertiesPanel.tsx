import { useTranslation } from 'react-i18next'
import NoteProperties from '../vault/NoteProperties'
import SideHead from '../layout/SideHead'

export default function PropertiesPanel() {
  const { t } = useTranslation()
  return (
    <div>
      <SideHead>{t('propertiesPanel.title')}</SideHead>
      <NoteProperties />
    </div>
  )
}
