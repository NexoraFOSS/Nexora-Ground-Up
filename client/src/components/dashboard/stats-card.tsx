import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconClass: string;
  footer: ReactNode;
}

export function StatsCard({ title, value, icon, iconClass, footer }: StatsCardProps) {
  return (
    <div className="bg-dark-card rounded-lg shadow-md p-4 border border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${iconClass}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {footer}
      </div>
    </div>
  );
}
