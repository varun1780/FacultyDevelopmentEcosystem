export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="page-title">Settings</h1>
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Notifications</h3>
        {['Email notifications', 'FDP enrollment alerts', 'Certificate issuance alerts', 'AI recommendation updates'].map((s, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">{s}</span>
            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" /></label>
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Blockchain</h3>
        <p className="text-sm text-gray-500">Connect your MetaMask wallet to manage certificates on the Ethereum blockchain.</p>
        <button className="btn-secondary">Connect MetaMask</button>
      </div>
    </div>
  );
}
