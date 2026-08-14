import { useNavigate } from 'react-router-dom'

export const useGoBack = () => {
  const navigate = useNavigate()
  return () => {
    requestAnimationFrame(() => {
      if (sessionStorage.getItem('lastPagePath')) navigate(-1)
      else navigate('/index/home')
    })
  }
}
