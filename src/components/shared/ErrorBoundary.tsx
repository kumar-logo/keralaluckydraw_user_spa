import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
     
    console.error('[ErrorBoundary]', error, info)
  }

  private handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="size-full min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
          <img
            src="/images/common/404.webp"
            alt=""
            className="w-28 opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <p className="text-main font-bold text-base">Something went wrong</p>
          <p className="text-acc text-sm max-w-xs">An unexpected error occurred while rendering this page. Please try again.</p>
          <button
            onClick={this.handleReload}
            className="mt-1 px-6 py-2 rounded-full bg-primary text-white text-sm font-bold active:opacity-80"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
