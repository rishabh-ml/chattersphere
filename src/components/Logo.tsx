"use client";
import Image from "next/image";
import React from "react";
import logo from "../../public/logo.png";

const Logo: React.FC = () => (
  <div className="flex items-center">
    <Image src={logo} alt="ChatterSphere Logo" width={40} height={40} />
    <span className="ml-2 text-2xl font-bold text-textDark">
      <span className="text-primary">Chatter</span>
      <span className="text-secondary">Sphere</span>
    </span>
  </div>
);

export default Logo;
