import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Image, Input } from '@nextui-org/react'
import { useAuthStore } from '../stores/authStore'
import { getUserInfo, getAvatarList, updateAvatar, updateNickname } from '../services/userApi'
import { toast } from '../utils/toast'
import { withLoading, resolveAssetUrl } from '../utils/helpers'
import { fetchAndSyncBalance } from '../utils/fetchBalance'
import { TopBar } from '../components/shared/TopBar'
import { Spin } from '../components/shared/Spin'

export const ProfilePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarList, setAvatarList] = useState<string[]>([])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState('')
  const userInfo = useAuthStore((s) => s.userInfo)
  const setUserInfo = useAuthStore((s) => s.setUserInfo)

  useEffect(() => {
    Promise.all([getUserInfo(), getAvatarList()])
      .then(([info, avatars]) => {
        if (info) {
          setUserInfo(info)
          setNickname(info.nickname ?? '')
        }
        if (Array.isArray(avatars)) setAvatarList(avatars)
        else if (avatars.list) setAvatarList(avatars.list)
      })
      .finally(() => setLoading(false))
  }, [setUserInfo])

  const handleSelectAvatar = (avatar: string) => {
    withLoading(setSaving, updateAvatar(avatar).then(() => {
      fetchAndSyncBalance()
      getUserInfo().then((data) => { if (data) setUserInfo(data) })
      setShowAvatarPicker(false)
      toast.success(t('common.tip.success.update'))
    }))
  }

  const handleSaveNickname = () => {
    const trimmed = nickname.trim()
    if (!trimmed) {
      toast.warning(t('profile.tip.nicknameEmpty'))
      return
    }
    withLoading(setSaving, updateNickname(trimmed).then(() => {
      fetchAndSyncBalance()
      getUserInfo().then((data) => { if (data) setUserInfo(data) })
      setEditingNickname(false)
      toast.success(t('common.tip.success.update'))
    }))
  }

  return (
    <div className="size-full flex flex-col">
      <TopBar title={t('common.label.profile')} />

      <Spin className="flex-1 flex flex-col" loading={loading}>
        <div className="flex-1 p-4">

          <div className="p-4 bg-white dark:bg-gray rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-main">{t('profile.label.avatar')}</span>
              <div
                className="flex items-center cursor-pointer"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              >
                <div className="size-12 rounded-full overflow-hidden bg-selected">
                  {userInfo?.avatar ? (
                    <Image src={resolveAssetUrl(userInfo.avatar)} removeWrapper className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center bg-primary/20 text-primary text-lg font-bold">
                      {(userInfo?.nickname ?? 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <svg viewBox="0 0 14 14" className="size-3.5 text-acc ml-2" fill="none">
                  <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {showAvatarPicker && (
              <div className="mt-3 grid grid-cols-5 gap-3">
                {avatarList.map((avatar, idx) => (
                  <div
                    key={idx}
                    className={`size-14 rounded-full overflow-hidden cursor-pointer border-2 ${
                      userInfo?.avatar === avatar ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => handleSelectAvatar(avatar)}
                  >
                    <Image src={resolveAssetUrl(avatar)} removeWrapper className="size-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-gray rounded-lg mb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-bold text-main">{t('profile.label.nickname')}</span>
              {editingNickname ? (
                <div className="flex items-center gap-2 flex-wrap justify-end min-w-0">
                  <Input
                    value={nickname}
                    onValueChange={setNickname}
                    size="sm"
                    maxLength={20}
                    className="w-28 min-w-0"
                    classNames={{ inputWrapper: 'h-8 bg-selected rounded' }}
                  />
                  <Button
                    size="sm"
                    isLoading={saving}
                    className="h-8 bg-primary text-black font-bold rounded text-xs"
                    onPress={handleSaveNickname}
                  >
                    {t('common.label.save')}
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-selected text-main font-bold rounded text-xs"
                    onPress={() => {
                      setEditingNickname(false)
                      setNickname(userInfo?.nickname ?? '')
                    }}
                  >
                    {t('common.label.cancel')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center cursor-pointer" onClick={() => setEditingNickname(true)}>
                  <span className="text-sm text-acc">{userInfo?.nickname ?? '-'}</span>
                  <svg viewBox="0 0 14 14" className="size-3.5 text-acc ml-2" fill="none">
                    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-main">{t('profile.label.phone')}</span>
              <div className="flex items-center">
                <span className="text-sm text-acc">
                  {userInfo?.phone
                    ? userInfo.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
                    : t('profile.label.notBound')}
                </span>
                {userInfo?.phone ? (
                  <svg className="size-4 text-[#009919] ml-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 14 14" className="size-3.5 text-acc ml-2" fill="none">
                    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-main">Telegram</span>
              <div className="flex items-center">
                <span className="text-sm text-acc">
                  {userInfo?.tgBound ? t('profile.label.bound') : t('profile.label.notBound')}
                </span>
                {userInfo?.tgBound ? (
                  <svg className="size-4 text-[#009919] ml-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 14 14" className="size-3.5 text-acc ml-2" fill="none">
                    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-main">Google</span>
              <div className="flex items-center">
                <span className="text-sm text-acc">
                  {userInfo?.googleBound ? t('profile.label.bound') : t('profile.label.notBound')}
                </span>
                {userInfo?.googleBound ? (
                  <svg className="size-4 text-[#009919] ml-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 14 14" className="size-3.5 text-acc ml-2" fill="none">
                    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray rounded-lg mt-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => navigate('/set-password')}>
              <span className="text-sm font-bold text-main">{t('profile.label.changePassword')}</span>
              <svg viewBox="0 0 14 14" className="size-3.5 text-acc ml-2" fill="none">
                <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  )
}

export default ProfilePage
