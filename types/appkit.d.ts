// Type declarations for @reown/appkit web components
declare namespace JSX {
  interface IntrinsicElements {
    'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean
      balance?: 'show' | 'hide'
      size?: 'sm' | 'md'
      label?: string
      loadingLabel?: string
    }
    'appkit-network-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean
    }
    'appkit-connect-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      size?: 'sm' | 'md'
      label?: string
      loadingLabel?: string
    }
    'appkit-account-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      disabled?: boolean
      balance?: 'show' | 'hide'
    }
  }
}

