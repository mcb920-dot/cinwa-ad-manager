import Sidebar from '../components/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-zinc-50 min-h-full overflow-auto">
        {children}
      </div>
    </div>
  )
}
