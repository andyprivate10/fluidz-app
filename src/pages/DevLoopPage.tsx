import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DevLoopPage() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/dev/test?dev=1') }, [])
  return null
}
