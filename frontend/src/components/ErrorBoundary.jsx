import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-4">Please refresh the page and try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;