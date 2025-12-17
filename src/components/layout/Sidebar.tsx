import { Calendar } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-indigo-900 text-white min-h-screen p-6">
      <div className="flex items-center space-x-3 mb-10">
        <Calendar className="w-8 h-8" />
        <h1 className="text-2xl font-bold">AGENDAPRO</h1>
      </div>
      
      <p className="text-blue-200">Menu em construção...</p>
    </aside>
  );
}
