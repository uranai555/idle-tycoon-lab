import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div className="phone-frame-container">
      <div className="phone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          {children}
        </div>
        <div className="phone-home-bar"></div>
      </div>
    </div>
  );
};

export default PhoneFrame;