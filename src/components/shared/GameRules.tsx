import { useEffect, useState } from 'react'
import { Modal, ModalContent, ScrollShadow, useDisclosure } from '@nextui-org/react'
import { useTranslation } from 'react-i18next'
import { CloseIcon } from './CloseIcon'
import { getGameRules } from '../../services/hallApi'

interface RuleSection {
  title: string
  content: string
}

const useRuleSections = (gameId?: number) => {
  const [sections, setSections] = useState<RuleSection[]>([])

  useEffect(() => {
    if (!gameId) {
      setSections([])
      return
    }
    getGameRules(gameId)
      .then((d: any) => setSections(Array.isArray(d?.sections) ? d.sections : []))
      .catch(() => setSections([]))
  }, [gameId])

  return sections
}

const RuleSectionList = ({ sections }: { sections: RuleSection[] }) => (
  <div className="flex flex-col gap-y-3 normal-case">
    {sections.map((section, index) => (
      <div key={index} className="flex flex-col">
        {section.title && (
          <p className="font-bold text-main mb-1">{section.title}</p>
        )}
        <p className="whitespace-pre-line text-sec leading-relaxed">
          {section.content}
        </p>
      </div>
    ))}
  </div>
)

export const GameRulesContent = ({ gameId }: { gameId?: number }) => {
  const sections = useRuleSections(gameId)
  if (!sections.length) return null
  return <RuleSectionList sections={sections} />
}

export const useGameRulesModal = (gameId?: number) => {
  const { t } = useTranslation()
  const sections = useRuleSections(gameId)
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure()

  return {
    open: onOpen,
    show: onOpen,
    close: onClose,
    hasRules: sections.length > 0,
    render: (
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        hideCloseButton
        radius="none"
        placement="center"
        classNames={{ backdrop: 'z-60', wrapper: 'z-60' }}
      >
        <ModalContent className="flex flex-col mx-2 p-5 rounded-2xl max-h-[80vh]">
          <div className="w-full flex items-center justify-between font-bold text-main mb-3">
            {t('common.label.games.rules')}
            <CloseIcon
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                e.preventDefault()
                onClose()
              }}
            />
          </div>
          <ScrollShadow className="flex-1 overflow-y-auto text-sm">
            <RuleSectionList sections={sections} />
          </ScrollShadow>
        </ModalContent>
      </Modal>
    ),
  }
}
