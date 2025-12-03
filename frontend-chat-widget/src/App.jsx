import ChatWidget from './ChatWidget.jsx'

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const businessId = urlParams.get('businessId') || '1';

  return <ChatWidget businessId={businessId} />;
}

export default App
