import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spinner } from '@nextui-org/react'

export const RedirectPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const target = searchParams.get('target') || searchParams.get('url') || searchParams.get('to')

    if (target) {
      if (target.startsWith('http')) {
        try {
          const url = new URL(target)
          if (url.origin === window.location.origin) {
            window.location.href = target
          } else {
            navigate('/index/home', { replace: true })
          }
        } catch {
          navigate('/index/home', { replace: true })
        }
      } else {
        navigate(target, { replace: true })
      }
    } else {
      navigate('/index', { replace: true })
    }
  }, [navigate, searchParams])

  return (
    <div className="size-full flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="text-sm text-acc mt-4">Redirecting...</p>
    </div>
  )
}

export default RedirectPage
