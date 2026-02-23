"use client";

import dynamic from "next/dynamic";

const MapExplorer = dynamic(() => import("./MapExplorer"), { ssr: false });

export default function MapClient() {
  return <MapExplorer />;
}
