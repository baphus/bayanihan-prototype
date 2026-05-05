import React from 'react';
import { AGENCIES_DATA } from '../../data/agenciesData';

const LogoMarquee: React.FC = () => {
  // Use unique logos from AGENCIES_DATA
  const logos = Array.from(new Set(AGENCIES_DATA.map(agency => agency.logoUrl)));
  
  // Duplicate logos for seamless looping
  const marqueeLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="bg-surface py-2 overflow-hidden pointer-events-none select-none">
      <div className="relative flex overflow-x-hidden">
        <div className="animate-marquee whitespace-nowrap flex items-center">
          {marqueeLogos.map((logo, index) => (
            <div key={index} className="mx-12 flex-shrink-0">
              <img
                src={logo}
                alt="Partner Agency Logo"
                className="h-16 w-auto max-w-[120px] object-contain opacity-80 transition-all duration-500 hover:opacity-100"
              />
            </div>
          ))}
        </div>

        <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center">
          {marqueeLogos.map((logo, index) => (
            <div key={`dup-${index}`} className="mx-12 flex-shrink-0">
              <img
                src={logo}
                alt="Partner Agency Logo"
                className="h-16 w-auto max-w-[120px] object-contain opacity-80 transition-all duration-500 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee2 {
          0% { transform: translateX(50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee2 {
          animation: marquee 60s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LogoMarquee;
