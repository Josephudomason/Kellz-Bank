"use client";

import { Lottie, LottieDisplay } from "lottie-react";
import animationData from "@/public/Two factor authentication.json";

export default function AuthLottie() {
  return (
    <Lottie src={animationData} loop autoplay className="relative h-full w-full">
      <LottieDisplay className="absolute inset-0" />
    </Lottie>
  );
}
